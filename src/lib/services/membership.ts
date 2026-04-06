import type { WorkspaceRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { requireWorkspaceRole } from '@/lib/workspace-auth';

export async function listMembers(workspaceId: string, actorUserId: string) {
  await requireWorkspaceRole(workspaceId, actorUserId, 'MEMBER');

  const rows = await prisma.workspaceMembership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    createdAt: m.createdAt,
  }));
}

export async function updateMemberRole(
  workspaceId: string,
  membershipId: string,
  actorUserId: string,
  newRole: WorkspaceRole
) {
  const actor = await requireWorkspaceRole(workspaceId, actorUserId, 'ADMIN');

  if (newRole === 'OWNER') {
    throw new ApiError(403, 'Cannot assign owner role via this action', 'FORBIDDEN');
  }

  const target = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId },
  });
  if (!target) {
    throw new ApiError(404, 'Membership not found', 'NOT_FOUND');
  }

  if (target.role === 'OWNER') {
    throw new ApiError(403, 'Cannot change the workspace owner role here', 'FORBIDDEN');
  }

  if (actor.role === 'ADMIN' && target.role === 'ADMIN') {
    throw new ApiError(403, 'Admins cannot modify other admins', 'FORBIDDEN');
  }

  return prisma.workspaceMembership.update({
    where: { id: membershipId },
    data: { role: newRole },
  });
}

export async function removeMember(
  workspaceId: string,
  membershipId: string,
  actorUserId: string
) {
  const actor = await requireWorkspaceRole(workspaceId, actorUserId, 'ADMIN');

  const target = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId },
  });
  if (!target) {
    throw new ApiError(404, 'Membership not found', 'NOT_FOUND');
  }

  if (target.role === 'OWNER') {
    throw new ApiError(403, 'Cannot remove the workspace owner', 'FORBIDDEN');
  }

  if (actor.role === 'ADMIN') {
    if (target.role === 'ADMIN') {
      throw new ApiError(403, 'Admins cannot remove other admins', 'FORBIDDEN');
    }
  }

  await prisma.workspaceMembership.delete({ where: { id: membershipId } });
}
