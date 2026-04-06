import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { requireWorkspaceRole } from '@/lib/workspace-auth';

export async function createWorkspace(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ApiError(400, 'Name is required', 'VALIDATION');
  }

  return prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: trimmed,
        ownerId: userId,
      },
    });
    await tx.workspaceMembership.create({
      data: {
        userId,
        workspaceId: ws.id,
        role: 'OWNER',
      },
    });
    await tx.businessInfo.create({
      data: {
        workspaceId: ws.id,
        name: trimmed,
        industry: 'General',
        currency: 'USD',
      },
    });
    return ws;
  });
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
    createdAt: m.workspace.createdAt,
  }));
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found', 'NOT_FOUND');
  }
  if (workspace.ownerId !== userId) {
    throw new ApiError(403, 'Only the workspace owner can delete it', 'FORBIDDEN');
  }
  await prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function getWorkspaceForMember(workspaceId: string, userId: string) {
  await requireWorkspaceRole(workspaceId, userId, 'MEMBER');
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found', 'NOT_FOUND');
  }
  return workspace;
}
