import { auth } from '@clerk/nextjs/server';
import type { WorkspaceRole } from '@prisma/client';
import { ensureDbUser } from '@/lib/auth/ensure-db-user';
import { requireWorkspaceRole } from '@/lib/workspace-auth';

export async function requireWorkspaceAccess(
  workspaceId: string,
  minRole: WorkspaceRole = 'MEMBER'
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const user = await ensureDbUser(userId);
  await requireWorkspaceRole(workspaceId, user.id, minRole);
  return { user, userId: user.id };
}
