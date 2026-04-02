'use server';

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function getCompanyContext() {
  const [products, orders, customers, businessInfo] = await Promise.all([
    prisma.product.findMany({ select: { name: true, quantity: true, salePrice: true, variant: true, category: true }, take: 20 }),
    prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { total: true, createdAt: true, customerName: true } }),
    prisma.customer.findMany({ select: { segment: true, totalSpent: true }, take: 20 }),
    prisma.businessInfo.findUnique({ where: { id: 'singleton' } }),
  ]);

  return { products, orders, customers, businessInfo };
}

export async function getAIInsights() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('Gemini API key missing or placeholder. Returning mock data.');
      return [
        {
          id: 'mock-1',
          type: 'restock',
          title: 'Immediate Restock Needed (Mock)',
          description: 'Organic White Chia seeds are dropping 22% faster than last month. 3 major orders in queue.',
          action: 'Bulk Order Now',
          urgency: 'high',
          createdAt: new Date().toISOString(),
        }
      ];
    }

    const context = await getCompanyContext();
    const prompt = `You are an expert SMB consultant for "Arbitury," a seeds and wellness business.
Analyze the Context provided and return a JSON OBJECT with an "insights" key containing an array of 2-3 specific business "insights." 
Each insight must have: 
- type: "restock" | "pricing" | "trend" | "upsell" | "churn"
- title: string
- description: string
- action: string
- urgency: "low" | "medium" | "high"

Context (JSON): ${JSON.stringify(context)}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const response = await result.response;
    const content = response.text() || '{"insights": []}';
    
    let data;
    try {
      const jsonStr = content.replace(/```json|```/g, '').trim();
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error('AI JSON parse error:', e, 'Raw content:', content);
      return [];
    }

    const insights = Array.isArray(data) ? data : (data.insights || data.insight || []);
    return insights.map((ins: any, i: number) => ({
      id: `ai-${Date.now()}-${i}`,
      ...ins,
      createdAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error('getAIInsights overall error:', error.message || error);
    if (error.status === 404 || error.status === 400) {
       console.error('API Error details:', error);
    }
    return [];
  }
}

export async function chatWithAI(messages: any[]) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { role: 'assistant', content: 'Gemini API key missing. Please check your .env configuration.' };
    }

    const context = await getCompanyContext();
    
    // Gemini history MUST start with 'user'. Filter out any initial 'model' turns from UI greetings.
    let history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Find the first index that is 'user'
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      history = history.slice(firstUserIndex);
    } else {
      history = []; // No user message yet, start fresh
    }

    const userMessage = messages[messages.length - 1].content;

    // Use a fresh model for chat to include system instruction reliably
    const chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: `You are the Arbitury Pro Assistant. Context: ${JSON.stringify(context)}. Provide brief, actionable, technical advice. If asked about revenue, summarize based on provided orders.`,
    });

    const chat = chatModel.startChat({
      history: history,
    });

    const result = await chat.sendMessage(userMessage);
    return {
      role: 'assistant',
      content: result.response.text() || "I couldn't process that request.",
    };
  } catch (error: any) {
    console.error('chatWithAI overall error:', error.message || error);
    return { role: 'assistant', content: `Analyzing error: ${error.message || 'Unknown error'}. Check your GEMINI_API_KEY.` };
  }
}

export async function forecastDepletion(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return 'Product not available in the database.';

    // Base calculation
    const avgDailySales = 2.4; 
    const daysLeft = Math.round(product.quantity / avgDailySales);
    
    let advice = '';
    if (daysLeft < 7) advice = '⚠️ Critical: Restock immediately.';
    else if (daysLeft < 14) advice = '⚡ Warning: Reorder soon.';
    else advice = '✅ Healthy: Stock levels stable.';

    return `**${product.name}**\n\n- Current Stock: **${product.quantity} units**\n- Est. Runway: **${daysLeft} days**\n- Daily Velocity: **${avgDailySales} units/day**\n\n${advice}`;
  } catch (error) {
    return 'Analysis failed. Please try again later.';
  }
}
