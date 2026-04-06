'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

export async function getBusinessInfo(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    let info = await prisma.businessInfo.findUnique({
      where: { workspaceId },
    });

    if (!info) {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      info = await prisma.businessInfo.create({
        data: {
          workspaceId,
          name: ws?.name || 'Workspace',
          industry: 'General Retail',
          description: '',
          currency: 'USD',
        },
      });
    }

    return info;
  } catch (error) {
    console.error('getBusinessInfo error:', error);
    return null;
  }
}

export async function updateBusinessInfo(workspaceId: string, data: Record<string, unknown>) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const info = await prisma.businessInfo.upsert({
      where: { workspaceId },
      update: data,
      create: {
        workspaceId,
        name: (data.name as string) || 'Workspace',
        industry: (data.industry as string) || 'General',
        description: (data.description as string) || null,
        website: (data.website as string) || null,
        currency: (data.currency as string) || 'USD',
      },
    });
    revalidatePath('/workspaces');
    return { success: true, data: info };
  } catch (error) {
    console.error('updateBusinessInfo error:', error);
    return { success: false, error: 'Failed to update business info' };
  }
}
