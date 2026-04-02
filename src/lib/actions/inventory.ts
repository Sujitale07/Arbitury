'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function getInventoryLogs() {
  try {
    return await prisma.inventoryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (error) {
    console.error('getInventoryLogs error:', error);
    return [];
  }
}

export async function adjustInventory(data: {
  productId: string;
  quantityChange: number;
  action: 'restock' | 'adjustment' | 'expired';
  notes?: string;
  createdBy?: string;
}) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const product = await tx.product.update({
        where: { id: data.productId },
        data: {
          quantity: { increment: data.quantityChange }
        }
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
        }
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
