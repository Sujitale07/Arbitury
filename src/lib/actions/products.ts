'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
}

export async function createProduct(data: any) {
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
      }
    });
    revalidateTag('products', '');
    return { success: true, data: product };
  } catch (error) {
    console.error('createProduct error:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
      }
    });
    revalidateTag('products', '');
    return { success: true, data: product };
  } catch (error) {
    console.error('updateProduct error:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidateTag('products', '');
    return { success: true };
  } catch (error) {
    console.error('deleteProduct error:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}
