'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function getDashboardMetrics() {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const lastWeekStart = startOfDay(subDays(todayStart, 7));
    const previousWeekStart = startOfDay(subDays(todayStart, 14));

    // 1. Today's Revenue & Orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'cancelled' },
      },
    });
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + o.total, 0);

    // 2. Inventory Value & Low Stock
    const products = await prisma.product.findMany();
    const totalInventoryValue = products.reduce((sum: number, p: any) => sum + (p.quantity * p.costPrice), 0);
    const lowStockCount = products.filter((p: any) => p.quantity <= p.lowStockThreshold).length;

    // 3. Weekly Revenue (Last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(todayStart, i);
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startOfDay(d), lte: endOfDay(d) },
          status: { not: 'cancelled' },
        },
      });
      weeklyData.push({
        date: d.toISOString(),
        revenue: orders.reduce((sum: number, o: any) => sum + o.total, 0),
        orders: orders.length,
        units: 0, 
      });
    }

    // 4. Growth Calculations (Simplified)
    const thisWeekOrders = await prisma.order.count({
      where: { createdAt: { gte: lastWeekStart }, status: { not: 'cancelled' } },
    });
    const lastWeekOrders = await prisma.order.count({
      where: { 
        createdAt: { gte: previousWeekStart, lt: lastWeekStart },
        status: { not: 'cancelled' },
      },
    });
    const ordersGrowth = lastWeekOrders === 0 ? 100 : Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100);

    // 5. Top Products (Join items)
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
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

    const totalSoldRevenue = topItems.reduce((sum: number, item: any) => sum + (item._sum.total || 0), 0);
    const topProducts = await Promise.all(
      topItems.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { variant: true },
        });
        return {
          productId: item.productId,
          productName: item.productName,
          variant: product?.variant || 'mixed',
          totalSold: item._sum.quantity || 0,
          revenue: item._sum.total || 0,
          percentage: totalSoldRevenue === 0 ? 0 : Math.round(((item._sum.total || 0) / totalSoldRevenue) * 100),
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
      revenueGrowth: ordersGrowth, // Using orders growth as a proxy for now
      ordersGrowth,
    };
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
}
