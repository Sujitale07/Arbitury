'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import type { OrderStatus, SaleChannel } from '@prisma/client';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderInput {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  tax: number;
  total: number;
  status?: OrderStatus;
  channel?: SaleChannel;
  shippingAddress?: string;
  notes?: string;
  items: OrderItemInput[];
}

export async function getOrders(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    return await prisma.order.findMany({
      where: { workspaceId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('getOrders error:', error);
    return [];
  }
}

export async function createOrder(workspaceId: string, data: OrderInput) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          workspaceId,
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          status: data.status || 'pending',
          channel: data.channel || 'online',
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: data.total },
          lastOrderDate: new Date(),
        },
      });

      for (const item of data.items) {
        const product = await tx.product.update({
          where: { id: item.productId, workspaceId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            productName: item.productName,
            action: 'sale',
            quantityChange: -item.quantity,
            previousQty: product.quantity + item.quantity,
            newQty: product.quantity,
            createdBy: 'System (Order)',
          },
        });
      }

      return order;
    });

    revalidateTag('orders', '');
    revalidateTag('products', '');
    revalidateTag('customers', '');
    return { success: true, data: result };
  } catch (error) {
    console.error('createOrder error:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

export async function checkoutManualOrder(workspaceId: string, checkoutData: any, cartItems: any[]) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const { firstName, lastName, email, address, city, state, zip, notes } = checkoutData;
    const customerName = `${firstName} ${lastName}`;
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;

    let customer = await prisma.customer.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          workspaceId,
          name: customerName,
          email,
          phone: checkoutData.phone || '',
        },
      });
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const orderNumber = `AR-${Date.now().toString().slice(-6)}`;

    const orderData: OrderInput = {
      orderNumber,
      customerId: customer.id,
      customerName,
      customerEmail: email,
      subtotal,
      tax,
      total,
      status: 'pending' as OrderStatus,
      channel: 'online' as SaleChannel,
      shippingAddress: fullAddress,
      notes,
      items: cartItems.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
    };

    return await createOrder(workspaceId, orderData);
  } catch (error) {
    console.error('checkoutManualOrder error:', error);
    return { success: false, error: 'Checkout failed' };
  }
}

export async function recordManualSale(workspaceId: string, data: any) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const { customerName, email, items, channel } = data;
    const finalEmail = email || `walkin-${Date.now()}@arbitury.com`;

    let customer = await prisma.customer.findUnique({
      where: { workspaceId_email: { workspaceId, email: finalEmail } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          workspaceId,
          name: customerName,
          email: finalEmail,
        },
      });
    }

    const orderItems = await Promise.all(
      items.map(async (item: { productId: string; quantity: number }) => {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, workspaceId },
          select: { name: true, salePrice: true },
        });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: product?.salePrice || 0,
          total: (product?.salePrice || 0) * item.quantity,
        };
      })
    );

    const subtotal = orderItems.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const orderNumber = `MS-${Date.now().toString().slice(-6)}`;

    const orderData: OrderInput = {
      orderNumber,
      customerId: customer.id,
      customerName,
      customerEmail: finalEmail,
      subtotal,
      tax,
      total,
      status: 'delivered' as OrderStatus,
      channel: (channel || 'market') as SaleChannel,
      items: orderItems,
    };

    return await createOrder(workspaceId, orderData);
  } catch (error) {
    console.error('recordManualSale error:', error);
    return { success: false, error: 'Failed to record sale' };
  }
}

export async function updateOrderStatus(workspaceId: string, id: string, status: OrderStatus) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const order = await prisma.order.update({
      where: { id, workspaceId },
      data: { status },
    });
    revalidateTag('orders', '');
    return { success: true, data: order };
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

export async function recoverAbandonedCart(workspaceId: string, customerId: string, items: any[]) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });
    if (!customer) return { success: false };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a warm, helpful brand voice for Arbitury, a seeds and wellness company. Generate a "Don't forget your cart" email body. Keep it light, mention the specific items, and add a limited-time 5% discount code ARBITURY5.
    
    Customer: ${customer.name}, Items: ${JSON.stringify(items)}`;

    const result = await model.generateContent(prompt);
    const body = result.response.text();

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Arbitury Recovery <sales@arbitury.com>',
        to: customer.email,
        subject: `Still thinking about those seeds, ${customer.name}?`,
        html: `<div>${body?.replace(/\n/g, '<br/>')}</div>`,
      });
    }

    return { success: true, body };
  } catch (error) {
    console.error('Abandon recovery error:', error);
    return { success: false };
  }
}
