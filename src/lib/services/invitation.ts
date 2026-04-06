import type { WorkspaceRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { requireWorkspaceRole } from '@/lib/workspace-auth';
import { generateInviteToken, hashInviteToken, normalizeEmail } from '@/lib/invite-token';
import { sendWorkspaceInviteEmail } from '@/lib/email/send-workspace-invite';

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

const inviteableRoles: WorkspaceRole[] = ['ADMIN', 'MEMBER'];

export async function createInvitation(
  workspaceId: string,
  actorUserId: string,
  emailRaw: string,
  role: WorkspaceRole
) {
  await requireWorkspaceRole(workspaceId, actorUserId, 'ADMIN');

  if (!inviteableRoles.includes(role)) {
    throw new ApiError(400, 'Invite role must be ADMIN or MEMBER', 'VALIDATION');
  }

  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes('@')) {
    throw new ApiError(400, 'Valid email is required', 'VALIDATION');
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found', 'NOT_FOUND');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const member = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: { userId: existingUser.id, workspaceId },
      },
    });
    if (member) {
      throw new ApiError(409, 'User is already a member', 'ALREADY_MEMBER');
    }
  }

  const pending = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      email,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });
  if (pending) {
    throw new ApiError(409, 'An active invite already exists for this email', 'DUPLICATE_INVITE');
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await prisma.workspaceInvitation.create({
    data: {
      email,
      workspaceId,
      role,
      tokenHash,
      expiresAt,
      invitedByUserId: actorUserId,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const acceptUrl = `${base.replace(/\/$/, '')}/invite?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendWorkspaceInviteEmail({
      to: email,
      workspaceName: workspace.name,
      acceptUrl,
    });
  } catch (e) {
    await prisma.workspaceInvitation.delete({ where: { id: invite.id } }).catch(() => {});
    throw e;
  }

  return { inviteId: invite.id, expiresAt: invite.expiresAt };
}

export async function getInvitePreviewByRawToken(rawToken: string) {
  if (!rawToken || rawToken.length < 16) {
    return { valid: false as const, reason: 'invalid' as const };
  }
  const tokenHash = hashInviteToken(rawToken);
  const row = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash },
    include: { workspace: { select: { name: true } } },
  });
  if (!row || row.status !== 'PENDING') {
    return { valid: false as const, reason: 'invalid' as const };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.workspaceInvitation
      .updateMany({
        where: { id: row.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      })
      .catch(() => {});
    return { valid: false as const, reason: 'expired' as const };
  }
  return {
    valid: true as const,
    workspaceName: row.workspace.name,
    role: row.role,
    email: row.email,
  };
}

export async function acceptInvitation(actorUserId: string, actorEmail: string, rawToken: string) {
  if (!rawToken || rawToken.length < 16) {
    throw new ApiError(400, 'Invalid invitation token', 'INVALID_TOKEN');
  }
  const tokenHash = hashInviteToken(rawToken);
  const normalizedActorEmail = normalizeEmail(actorEmail);

  return prisma.$transaction(async (tx) => {
    const row = await tx.workspaceInvitation.findUnique({
      where: { tokenHash },
    });
    if (!row || row.status !== 'PENDING') {
      throw new ApiError(400, 'Invalid or already used invitation', 'INVALID_TOKEN');
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      await tx.workspaceInvitation.update({
        where: { id: row.id },
        data: { status: 'EXPIRED' },
      });
      throw new ApiError(400, 'Invitation has expired', 'EXPIRED');
    }

    if (normalizeEmail(row.email) !== normalizedActorEmail) {
      throw new ApiError(
        403,
        'Sign in with the email address this invitation was sent to',
        'EMAIL_MISMATCH'
      );
    }

    const existing = await tx.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: { userId: actorUserId, workspaceId: row.workspaceId },
      },
    });
    if (existing) {
      throw new ApiError(409, 'You are already a member of this workspace', 'ALREADY_MEMBER');
    }

    await tx.workspaceInvitation.update({
      where: { id: row.id },
      data: { status: 'ACCEPTED' },
    });

    await tx.workspaceMembership.create({
      data: {
        userId: actorUserId,
        workspaceId: row.workspaceId,
        role: row.role,
      },
    });

    return { workspaceId: row.workspaceId };
  });
}

export async function listPendingInvitations(workspaceId: string, actorUserId: string) {
  await requireWorkspaceRole(workspaceId, actorUserId, 'ADMIN');
  return prisma.workspaceInvitation.findMany({
    where: {
      workspaceId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}
