import type { WorkspaceRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';

const rank: Record<WorkspaceRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export async function requireWorkspaceRole(
  workspaceId: string,
  userId: string,
  minRole: WorkspaceRole
) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
  if (!membership) {
    throw new ApiError(403, 'Not a member of this workspace', 'NOT_MEMBER');
  }
  if (rank[membership.role] < rank[minRole]) {
    throw new ApiError(403, 'Insufficient permissions', 'FORBIDDEN');
  }
  return membership;
}
