import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth/ensure-db-user';
import { prisma } from '@/lib/prisma';

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export default async function WorkspaceLayout({ children, params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/workspaces/${id}`)}`);
  }

  const user = await ensureDbUser(userId);
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: id } },
  });

  if (!membership) {
    notFound();
  }

  return <>{children}</>;
}
