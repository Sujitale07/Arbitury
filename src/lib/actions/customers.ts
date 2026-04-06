'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import type { Customer, CustomerSegment } from '@prisma/client';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

export async function getCustomers(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    return await prisma.customer.findMany({
      where: { workspaceId },
      orderBy: { totalSpent: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return [];
  }
}

export async function runSegmentation(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const customers = await prisma.customer.findMany({ where: { workspaceId } });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const c of customers) {
      let segment: CustomerSegment = 'new';

      if (c.totalSpent > 1000 || c.totalOrders > 10) {
        segment = 'vip';
      } else if (c.totalOrders > 1) {
        if (c.lastOrderDate && c.lastOrderDate < thirtyDaysAgo) {
          segment = 'churned';
        } else {
          segment = 'repeat';
        }
      }

      if (segment !== c.segment) {
        await prisma.customer.update({
          where: { id: c.id },
          data: { segment },
        });
      }
    }

    revalidateTag('customers', '');
    return { success: true };
  } catch (error) {
    console.error('Failed segmentation run:', error);
    return { success: false };
  }
}

export async function updateCustomerSegment(
  workspaceId: string,
  id: string,
  segment: CustomerSegment
) {
  await requireWorkspaceAccess(workspaceId);
  const row = await prisma.customer.findFirst({ where: { id, workspaceId } });
  if (!row) throw new Error('Customer not found');
  const updated = await prisma.customer.update({
    where: { id },
    data: { segment },
  });
  revalidateTag('customers', '');
  return updated;
}

export async function getCustomerStats(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const customers = (await prisma.customer.findMany({
      where: { workspaceId },
    })) as Customer[];
    const totalRevenue = customers.reduce((sum: number, c: Customer) => sum + c.totalSpent, 0);
    const avgSpent = customers.length > 0 ? totalRevenue / customers.length : 0;

    const segmentCounts = customers.reduce(
      (acc: Record<string, number>, c: Customer) => {
        acc[c.segment] = (acc[c.segment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: customers.length,
      avgSpent,
      segments: segmentCounts,
    };
  } catch (error) {
    console.error('Failed to fetch customer stats:', error);
    return null;
  }
}

export async function updateCustomer(workspaceId: string, id: string, data: Partial<Customer>) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const row = await prisma.customer.findFirst({ where: { id, workspaceId } });
    if (!row) return { success: false, error: 'Not found' };
    const updated = await prisma.customer.update({
      where: { id },
      data,
    });
    revalidateTag('customers', '');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Failed to update customer:', error);
    return { success: false, error: 'Failed to update' };
  }
}

export async function deleteCustomer(workspaceId: string, id: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const row = await prisma.customer.findFirst({ where: { id, workspaceId } });
    if (!row) return { success: false, error: 'Not found' };
    await prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({
        where: { customerId: id, workspaceId },
      });

      await tx.customer.delete({
        where: { id },
      });
    });

    revalidateTag('customers', '');
    revalidateTag('orders', '');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: 'Failed to delete customer. Ensure no constraints prevent this.' };
  }
}
