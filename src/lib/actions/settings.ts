'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function getBusinessInfo() {
  try {
    let info = await prisma.businessInfo.findUnique({
      where: { id: 'singleton' },
    });

    if (!info) {
      info = await prisma.businessInfo.create({
        data: {
          id: 'singleton',
          name: 'Arbitury Store',
          industry: 'General Retail',
          description: 'A premium lifestyle brand.',
          currency: 'USD'
        }
      });
    }

    return info;
  } catch (error) {
    console.error('getBusinessInfo error:', error);
    return null;
  }
}

export async function updateBusinessInfo(data: any) {
  try {
    const info = await prisma.businessInfo.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    revalidatePath('/ai');
    return { success: true, data: info };
  } catch (error) {
    console.error('updateBusinessInfo error:', error);
    return { success: false, error: 'Failed to update business info' };
  }
}
