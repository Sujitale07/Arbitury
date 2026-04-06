'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

export async function getDashboardMetrics(workspaceId: string) {
  await requireWorkspaceAccess(workspaceId);
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const lastWeekStart = startOfDay(subDays(todayStart, 7));
    const previousWeekStart = startOfDay(subDays(todayStart, 14));

    const todayOrders = await prisma.order.findMany({
      where: {
        workspaceId,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'cancelled' },
      },
    });
    const todayRevenue = todayOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    const products = await prisma.product.findMany({ where: { workspaceId } });
    const totalInventoryValue = products.reduce(
      (sum: number, p: { quantity: number; costPrice: number }) => sum + p.quantity * p.costPrice,
      0
    );
    const lowStockCount = products.filter(
      (p: { quantity: number; lowStockThreshold: number }) => p.quantity <= p.lowStockThreshold
    ).length;

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(todayStart, i);
      const orders = await prisma.order.findMany({
        where: {
          workspaceId,
          createdAt: { gte: startOfDay(d), lte: endOfDay(d) },
          status: { not: 'cancelled' },
        },
      });
      weeklyData.push({
        date: d.toISOString(),
        revenue: orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0),
        orders: orders.length,
        units: 0,
      });
    }

    const thisWeekOrders = await prisma.order.count({
      where: { workspaceId, createdAt: { gte: lastWeekStart }, status: { not: 'cancelled' } },
    });
    const lastWeekOrders = await prisma.order.count({
      where: {
        workspaceId,
        createdAt: { gte: previousWeekStart, lt: lastWeekStart },
        status: { not: 'cancelled' },
      },
    });
    const ordersGrowth =
      lastWeekOrders === 0
        ? 100
        : Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100);

    const topItems = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { workspaceId } },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 5,
    });

    const totalSoldRevenue = topItems.reduce(
      (sum: number, item: { _sum: { total: number | null } }) => sum + (item._sum.total || 0),
      0
    );
    const topProducts = await Promise.all(
      topItems.map(async (item: { productId: string; productName: string; _sum: { quantity: number | null; total: number | null } }) => {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, workspaceId },
          select: { variant: true },
        });
        return {
          productId: item.productId,
          productName: item.productName,
          variant: product?.variant || 'mixed',
          totalSold: item._sum.quantity || 0,
          revenue: item._sum.total || 0,
          percentage:
            totalSoldRevenue === 0
              ? 0
              : Math.round(((item._sum.total || 0) / totalSoldRevenue) * 100),
        };
      })
    );

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      totalInventoryValue,
      lowStockCount,
      weeklyRevenue: weeklyData,
      topProducts,
      revenueGrowth: ordersGrowth,
      ordersGrowth,
    };
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
}
