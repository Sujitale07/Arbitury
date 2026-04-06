'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

export async function getInventoryLogs(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    return await prisma.inventoryLog.findMany({
      where: { product: { workspaceId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (error) {
    console.error('getInventoryLogs error:', error);
    return [];
  }
}

export async function adjustInventory(
  workspaceId: string,
  data: {
    productId: string;
    quantityChange: number;
    action: 'restock' | 'adjustment' | 'expired';
    notes?: string;
    createdBy?: string;
  }
) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: data.productId, workspaceId },
        data: {
          quantity: { increment: data.quantityChange },
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          productId: data.productId,
          productName: product.name,
          action: data.action,
          quantityChange: data.quantityChange,
          previousQty: product.quantity - data.quantityChange,
          newQty: product.quantity,
          createdBy: data.createdBy || 'User',
        },
      });

      return { product, log };
    });

    revalidateTag('products', '');
    revalidateTag('inventoryLogs', '');
    revalidateTag('dashboard', '');
    return { success: true, data: result };
  } catch (error) {
    console.error('adjustInventory error:', error);
    return { success: false, error: 'Failed to adjust inventory' };
  }
}
