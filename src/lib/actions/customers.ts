'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import type { Customer, CustomerSegment } from '@prisma/client';

export async function getCustomers() {
  try {
    return await prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return [];
  }
}

export async function runSegmentation() {
  try {
    const customers = await prisma.customer.findMany();
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

export async function updateCustomerSegment(id: string, segment: CustomerSegment) {
  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: { segment },
    });
    revalidateTag('customers', '');
    return updated;
  } catch (error) {
    console.error('Failed to update customer segment:', error);
    throw error;
  }
}

export async function getCustomerStats() {
  try {
    const customers = await prisma.customer.findMany() as Customer[];
    const totalRevenue = customers.reduce((sum: number, c: Customer) => sum + c.totalSpent, 0);
    const avgSpent = customers.length > 0 ? totalRevenue / customers.length : 0;
    
    const segmentCounts = customers.reduce((acc: Record<string, number>, c: Customer) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

export async function updateCustomer(id: string, data: Partial<Customer>) {
  try {
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

export async function deleteCustomer(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all related orders first (cascading manually)
      await tx.order.deleteMany({
        where: { customerId: id },
      });
      
      // 2. Delete the customer
      await tx.customer.delete({
        where: { id: id },
      });
    });

    revalidateTag('customers', '');
    revalidateTag('orders', ''); // Also revalidate orders
    return { success: true };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: 'Failed to delete customer. Ensure no constraints prevent this.' };
  }
}
