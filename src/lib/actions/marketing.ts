'use server';

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { revalidateTag } from 'next/cache';
import { requireWorkspaceAccess } from '@/lib/server/require-workspace';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function runTrendAnalysis(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const [products, orders] = await Promise.all([
      prisma.product.findMany({ where: { workspaceId } }),
      prisma.order.findMany({
        where: { workspaceId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const context = { products, recentOrders: orders };

    const prompt = `You are a retail trend analyst. Analyze the data and suggest 1-2 flash sale opportunities (product name, discount %, rationale). Format as JSON object: { "deals": [{ "productName": string, "discount": number, "rationale": string }] }
    
    Data: ${JSON.stringify(context)}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const data = JSON.parse(result.response.text() || '{"deals": []}');
    return data.deals;
  } catch (error) {
    console.error('TrendAnalysis error:', error);
    return [];
  }
}

export async function sendAutomatedNewsletters(workspaceId: string, segment: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const customers = await prisma.customer.findMany({
      where: {
        workspaceId,
        ...(segment === 'all' ? {} : { segment: segment as 'new' | 'repeat' | 'vip' | 'churned' }),
      },
    });

    if (customers.length === 0) return { success: false, sent: 0 };

    const prompt = `Generate a short, high-conversion marketing email for ${segment} customers of Arbitury, a seeds and wellness brand. Focus on health and current trends. Return JSON: { "subject": string, "body": string }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const content = JSON.parse(result.response.text() || '{}');

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Arbitury <delivered@resend.dev>',
        to: customers.map((c) => c.email),
        subject: content.subject,
        html: `<div>${content.body.replace(/\n/g, '<br/>')}</div>`,
      });
    }

    return { success: true, sent: customers.length, subject: content.subject };
  } catch (error) {
    console.error('Newsletter error:', error);
    return { success: false, error: 'Failed' };
  }
}

export async function getCampaignHistory(workspaceId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    return await prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    return [];
  }
}

export async function createCampaign(workspaceId: string, data: any) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        name: data.name,
        subject: data.subject,
        content: data.content,
        targetSegment: data.targetSegment,
        status: data.sendNow ? 'sent' : data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });

    if (data.sendNow) {
      const sendRes = await sendCampaign(workspaceId, campaign.id);
      if (!sendRes.success) {
        return { success: true, data: campaign, warning: sendRes.error };
      }
    }

    revalidateTag('campaigns', '');
    return { success: true, data: campaign };
  } catch (error) {
    console.error('createCampaign error:', error);
    return { success: false, error: 'Failed' };
  }
}

export async function sendCampaign(workspaceId: string, campaignId: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) return { success: false, error: 'Campaign not found' };

    const customers = await prisma.customer.findMany({
      where: {
        workspaceId,
        ...(campaign.targetSegment === 'all'
          ? {}
          : { segment: campaign.targetSegment as 'new' | 'repeat' | 'vip' | 'churned' }),
      },
    });

    if (customers.length === 0) {
      return { success: false, error: 'No customers found in this segment' };
    }

    if (customers.length > 0 && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Arbitury <delivered@resend.dev>',
        to: customers.map((c) => c.email),
        subject: campaign.subject,
        html: `<div>${campaign.content.replace(/\n/g, '<br/>')}</div>`,
      });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'sent' },
    });

    return { success: true, count: customers.length };
  } catch (error: unknown) {
    console.error('sendCampaign error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send';
    return { success: false, error: message };
  }
}

export async function generateCampaignContent(workspaceId: string, prompt: string) {
  try {
    await requireWorkspaceAccess(workspaceId);
    const context = await prisma.product.findMany({
      where: { workspaceId, quantity: { gt: 0 } },
      take: 5,
      select: { name: true, variant: true, salePrice: true },
    });

    const fullPrompt = `You are an expert marketing copywriter for Arbitury, a seeds and wellness brand.
    Goal: ${prompt}
    Context (available products): ${JSON.stringify(context)}
    
    Generate exactly one short, punchy marketing email content.
    Return JSON format: { "subject": string, "body": string }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const text = result.response.text() || '{}';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('generateCampaignContent error:', error);
    return { subject: 'Campaign Update', body: 'Failed to generate AI content.' };
  }
}
