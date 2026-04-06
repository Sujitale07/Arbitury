import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth/ensure-db-user';
import { listWorkspacesForUser } from '@/lib/services/workspace';
import { WorkspacesClient } from './WorkspacesClient';

export default async function WorkspacesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/workspaces');
  }
  const user = await ensureDbUser(userId);
  const workspaces = await listWorkspacesForUser(user.id);
  return <WorkspacesClient initialWorkspaces={workspaces} />;
}
