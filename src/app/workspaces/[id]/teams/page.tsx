import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth/ensure-db-user';
import { prisma } from '@/lib/prisma';
import { WorkspaceSettingsClient } from './WorkspaceSettingsClient';

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceTeamPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/workspaces/${id}/team`)}`);
  }

  const user = await ensureDbUser(userId);
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: id } },
    include: { workspace: true },
  });

  if (!membership) {
    notFound();
  }

  const [members, invitations] = await Promise.all([
    prisma.workspaceMembership.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  const canManage = membership.role === 'OWNER' || membership.role === 'ADMIN';

  return (
    <WorkspaceSettingsClient
      workspaceId={id}
      workspaceName={membership.workspace.name}
      actorRole={membership.role}
      actorUserId={user.id}
      canManage={canManage}
      initialMembers={members.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      }))}
      initialInvitations={invitations}
    />
  );
}
