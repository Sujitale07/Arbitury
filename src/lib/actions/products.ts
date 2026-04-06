'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

export async function getProducts(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    return await prisma.product.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
}

export async function createProduct(workspaceId: string, data: any) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const product = await prisma.product.create({
      data: {
        workspaceId,
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
      },
    });
    revalidateTag('products', '');
    return { success: true, data: product };
  } catch (error) {
    console.error('createProduct error:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(workspaceId: string, id: string, data: any) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const product = await prisma.product.update({
      where: { id, workspaceId },
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
      },
    });
    revalidateTag('products', '');
    return { success: true, data: product };
  } catch (error) {
    console.error('updateProduct error:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(workspaceId: string, id: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    await prisma.product.delete({ where: { id, workspaceId } });
    revalidateTag('products', '');
    return { success: true };
  } catch (error) {
    console.error('deleteProduct error:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}
