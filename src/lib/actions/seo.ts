'use server';

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================================
// TYPES
// ============================================================

export interface SeoProjectInput {
  projectName: string;
  businessType: string;
  location?: string;
  seedKeywords: string[];
  competitors: string[];
}

export interface SeoKeywordResult {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  opportunityScore: number;
}

export interface SeoCompetitorResult {
  domain: string;
  estimatedTraffic: number;
  domainAuthority: number;
  topKeywords: string[];
  strategy: string;
  weaknesses: string[];
}

export interface SeoContentIdea {
  title: string;
  targetKeyword: string;
  estimatedTraffic: number;
  type: 'blog' | 'landing_page' | 'cluster' | 'guide';
  description: string;
}

export interface SeoActionResult {
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  trafficGain: number;
}

export interface SeoAnalysisResult {
  keywords: SeoKeywordResult[];
  competitors: SeoCompetitorResult[];
  contentIdeas: SeoContentIdea[];
  actions: SeoActionResult[];
}

// ============================================================
// BUSINESS CONTEXT — auto-pulled from existing DB
// ============================================================

async function getBusinessContext() {
  const [businessInfo, products, orders, customers] = await Promise.all([
    prisma.businessInfo.findUnique({ where: { id: 'singleton' } }),
    prisma.product.findMany({
      take: 20,
      select: { name: true, category: true, salePrice: true, quantity: true, supplier: true },
    }),
    prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { total: true, channel: true, customerName: true, createdAt: true },
    }),
    prisma.customer.findMany({
      take: 20,
      select: { segment: true, totalSpent: true, totalOrders: true },
    }),
  ]);

  return { businessInfo, products, orders, customers };
}

// ============================================================
// GEMINI HELPER — retry with exponential backoff
// ============================================================

async function callGeminiWithRetry(prompt: string, retries = 3): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      const text = result.response.text();
      JSON.parse(text.replace(/```json|```/g, '').trim()); // validate
      return text;
    } catch (err) {
      console.error(`Gemini attempt ${attempt} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1200));
    }
  }
  throw new Error('All retries exhausted');
}

// ============================================================
// MOCK FALLBACK
// ============================================================

function getMockAnalysis(ctx: {
  businessName: string;
  industry: string;
  topProducts: string[];
  competitors: string[];
}): SeoAnalysisResult {
  const biz = ctx.industry || ctx.businessName;
  const products = ctx.topProducts;

  return {
    keywords: [
      { keyword: `buy ${products[0] || biz} online`, searchVolume: 12400, difficulty: 35, intent: 'transactional', opportunityScore: 90 },
      { keyword: `best ${biz} products`, searchVolume: 8900, difficulty: 42, intent: 'commercial', opportunityScore: 82 },
      { keyword: `${biz} near me`, searchVolume: 6700, difficulty: 28, intent: 'commercial', opportunityScore: 88 },
      { keyword: `${products[0] || biz} benefits`, searchVolume: 4400, difficulty: 22, intent: 'informational', opportunityScore: 85 },
      { keyword: `organic ${biz}`, searchVolume: 3800, difficulty: 30, intent: 'commercial', opportunityScore: 81 },
      { keyword: `${biz} price`, searchVolume: 3200, difficulty: 38, intent: 'transactional', opportunityScore: 74 },
      { keyword: `how to use ${products[0] || biz}`, searchVolume: 2600, difficulty: 18, intent: 'informational', opportunityScore: 79 },
      { keyword: `${biz} wholesale`, searchVolume: 1800, difficulty: 25, intent: 'commercial', opportunityScore: 86 },
      { keyword: `${biz} recipes`, searchVolume: 5200, difficulty: 20, intent: 'informational', opportunityScore: 83 },
      { keyword: `best ${products[1] || biz} brand`, searchVolume: 2900, difficulty: 55, intent: 'commercial', opportunityScore: 60 },
    ],
    competitors: ctx.competitors.length
      ? ctx.competitors.slice(0, 3).map((domain, i) => ({
          domain,
          estimatedTraffic: [52000, 31000, 15000][i] ?? 8000,
          domainAuthority: [71, 57, 43][i] ?? 32,
          topKeywords: [`best ${biz}`, `${biz} shop`, `buy ${biz}`],
          strategy: `Focuses on content marketing and long-tail keywords. Strong presence in organic search with an established backlink profile from industry directories and health blogs.`,
          weaknesses: ['Thin product descriptions', 'Slow mobile page speed', 'No local SEO optimization'],
        }))
      : [{
          domain: 'example-competitor.com',
          estimatedTraffic: 42000,
          domainAuthority: 58,
          topKeywords: [`best ${biz}`, `${biz} store`, `buy ${biz} online`],
          strategy: 'Relies heavily on paid search but has weak organic content strategy and thin blog coverage.',
          weaknesses: ['No long-form content', 'High bounce rate on product pages', 'Missing schema markup'],
        }],
    contentIdeas: [
      { title: `The Complete Guide to ${biz}`, targetKeyword: `${biz} guide`, estimatedTraffic: 2800, type: 'guide', description: 'Comprehensive authority guide to dominate informational searches.' },
      { title: `Top 10 Benefits of ${products[0] || biz}`, targetKeyword: `${products[0] || biz} benefits`, estimatedTraffic: 1900, type: 'blog', description: 'High-traffic listicle targeting informational intent.' },
      { title: `How to Use ${products[0] || biz} Every Day`, targetKeyword: `how to use ${products[0] || biz}`, estimatedTraffic: 1200, type: 'blog', description: 'Tutorial post for beginners driving repeat visitors.' },
      { title: `${biz} Products — Shop Online`, targetKeyword: `buy ${biz} online`, estimatedTraffic: 4200, type: 'landing_page', description: 'High-converting product landing page targeting transactional intent.' },
      { title: `${products[1] || biz} vs ${products[0] || 'Alternatives'}: Which is Better?`, targetKeyword: `${biz} comparison`, estimatedTraffic: 1500, type: 'blog', description: 'Comparison post that captures decision-stage traffic.' },
      { title: `Wholesale ${biz} for Businesses`, targetKeyword: `${biz} wholesale`, estimatedTraffic: 900, type: 'landing_page', description: 'B2B landing page targeting wholesale buyers.' },
      { title: `${biz} Content Hub`, targetKeyword: `${biz}`, estimatedTraffic: 3500, type: 'cluster', description: 'Pillar content cluster to establish topical authority.' },
      { title: `${products[0] || biz} Recipes & Ideas`, targetKeyword: `${biz} recipes`, estimatedTraffic: 2100, type: 'blog', description: 'Lifestyle content targeting high-volume recipe searches.' },
    ],
    actions: [
      { action: 'Optimize product page title tags & meta descriptions', description: 'Update all product pages with keyword-rich titles under 60 characters and compelling meta descriptions.', priority: 'high', expectedImpact: 'CTR increase of 15-25% within 30 days', trafficGain: 1400 },
      { action: 'Create a Google Business Profile', description: 'Set up and fully complete your Google Business Profile to appear in local search and Google Maps results.', priority: 'high', expectedImpact: 'Local Pack visibility for 20+ keywords', trafficGain: 3800 },
      { action: 'Build out a content blog', description: 'Publish 1-2 SEO articles per week targeting identified informational keywords to drive organic growth.', priority: 'high', expectedImpact: '40% organic traffic increase over 90 days', trafficGain: 5200 },
      { action: 'Add structured data (Schema.org) to products', description: 'Implement Product + Review schema markup to enable rich snippets in Google Search results.', priority: 'medium', expectedImpact: 'Rich snippet eligibility, higher CTR', trafficGain: 800 },
      { action: 'Improve page load speed (Core Web Vitals)', description: 'Optimize images, enable lazy loading, and minimize JS to improve LCP and CLS scores.', priority: 'medium', expectedImpact: 'Better mobile rankings and user retention', trafficGain: 900 },
      { action: 'Build backlinks from industry directories', description: 'Submit to 10-15 relevant niche directories, health blogs, and industry publications.', priority: 'medium', expectedImpact: 'Domain authority +5-8 points in 60 days', trafficGain: 600 },
      { action: 'Audit and fix internal linking', description: 'Ensure all product pages are linked from relevant blog posts and category pages.', priority: 'low', expectedImpact: 'Better crawl efficiency and link equity distribution', trafficGain: 300 },
      { action: 'Set up Google Search Console', description: 'Connect GSC to monitor performance, find indexing errors, and track keyword impressions.', priority: 'low', expectedImpact: 'Full visibility into organic performance data', trafficGain: 0 },
    ],
  };
}

// ============================================================
// PROJECTS
// ============================================================

export async function getSeoProjects() {
  return prisma.seoProject.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { keywords: true } } },
  });
}

export async function deleteSeoProject(id: string) {
  await prisma.seoProject.delete({ where: { id } });
  revalidatePath('/marketing/seo');
  return { success: true };
}

// ============================================================
// MAIN: Analyze SEO
// ============================================================

export async function analyzeSeo(input: SeoProjectInput) {
  try {
    const ctx = await getBusinessContext();
    const { businessInfo, products, orders, customers } = ctx;

    const businessName = input.projectName || businessInfo?.name || 'Our Business';
    const industry = input.businessType || businessInfo?.industry || 'General';
    const topProducts = products.slice(0, 6).map(p => p.name);
    const topCategories = [...new Set(products.map(p => p.category))].slice(0, 4);

    const apiKey = process.env.GEMINI_API_KEY;
    let analysisData: SeoAnalysisResult;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY missing — using mock SEO data');
      analysisData = getMockAnalysis({
        businessName,
        industry,
        topProducts,
        competitors: input.competitors
      });
    } else {
      const prompt = `You are a world-class SEO strategist. Using the business data below, generate a highly specific SEO analysis.

BUSINESS DATA:
- Business Name: ${businessName}
- Industry: ${industry}
- Context/Location: ${input.location || 'Global'}
- Top Products: ${topProducts.join(', ')}
- Product Categories: ${topCategories.join(', ')}
- Seed Keywords provided: ${input.seedKeywords.join(', ')}
- Competitor Domains provided: ${input.competitors.join(', ')}

Return a single JSON object with exactly this structure:
{
  "keywords": [
    { "keyword": "...", "searchVolume": number, "difficulty": number, "intent": "...", "opportunityScore": number }
  ],
  "competitors": [
    { "domain": "...", "estimatedTraffic": number, "domainAuthority": number, "topKeywords": [...], "strategy": "...", "weaknesses": [...] }
  ],
  "contentIdeas": [
    { "title": "...", "targetKeyword": "...", "estimatedTraffic": number, "type": "...", "description": "..." }
  ],
  "actions": [
    { "action": "...", "description": "...", "priority": "...", "expectedImpact": "...", "trafficGain": number }
  ]
}

Generate: exactly 10 keywords, at least 2 competitors, 8 content ideas, 8 actions.`;

      const raw = await callGeminiWithRetry(prompt);
      analysisData = JSON.parse(raw.replace(/```json|```/g, '').trim()) as SeoAnalysisResult;
    }

    const keywords = analysisData.keywords || [];
    const competitors = analysisData.competitors || [];
    const actions = analysisData.actions || [];

    const project = await prisma.seoProject.create({
      data: {
      name: businessName,
        businessType: industry,
        location: input.location || null,
        website: businessInfo?.website || null,
        seedKeywords: input.seedKeywords,
        keywords: {
          create: keywords.map(k => ({
            keyword: k.keyword,
            searchVolume: k.searchVolume || 0,
            difficulty: Math.min(100, Math.max(0, k.difficulty || 0)),
            intent: k.intent || 'informational',
            opportunityScore: Math.min(100, Math.max(0, k.opportunityScore || 0)),
            currentRank: Math.floor(Math.random() * 80) + 1,
          })),
        },
        competitors: {
          create: competitors.map(c => ({
            domain: c.domain,
            estimatedTraffic: c.estimatedTraffic || 0,
            domainAuthority: Math.min(100, Math.max(0, c.domainAuthority || 0)),
            topKeywords: c.topKeywords || [],
            strategy: c.strategy || '',
            weaknesses: c.weaknesses || [],
          })),
        },
        actions: {
          create: actions.map(a => ({
            action: a.action,
            description: a.description || '',
            priority: a.priority || 'medium',
            expectedImpact: a.expectedImpact || '',
            trafficGain: a.trafficGain || 0,
          })),
        },
      },
      include: { keywords: true },
    });

    await Promise.all(
      project.keywords.map(kw =>
        prisma.seoRanking.create({
          data: {
            keywordId: kw.id,
            position: kw.currentRank || 50,
            url: `https://mysite.com/solutions/${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          },
        })
      )
    );

    revalidatePath('/marketing/seo');
    return { success: true, data: { projectId: project.id, keywords: project.keywords } };
  } catch (error: any) {
    console.error('analyzeSeo error:', error);
    return { success: false, error: error.message || 'Analysis failed.' };
  }
}

export async function reAnalyzeProject(projectId: string) {
  try {
    const project = await prisma.seoProject.findUnique({
      where: { id: projectId },
      include: { keywords: true, competitors: true, actions: true }
    });
    if (!project) throw new Error('Project not found');

    const ctx = await getBusinessContext();
    const { products } = ctx;
    const topProducts = products.slice(0, 6).map(p => p.name);

    const apiKey = process.env.GEMINI_API_KEY;
    let analysisData: SeoAnalysisResult;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      analysisData = getMockAnalysis({ 
        businessName: project.name, 
        industry: project.businessType, 
        topProducts, 
        competitors: project.competitors.map(c => c.domain) 
      });
    } else {
      const prompt = `Refresh SEO analysis for "${project.name}". Industry: ${project.businessType}.`;
      const raw = await callGeminiWithRetry(prompt);
      analysisData = JSON.parse(raw.replace(/```json|```/g, '').trim()) as SeoAnalysisResult;
    }

    const keywords = analysisData.keywords || [];
    const competitors = analysisData.competitors || [];
    const actions = analysisData.actions || [];

    await prisma.$transaction([
      prisma.seoKeyword.deleteMany({ where: { projectId } }),
      prisma.seoCompetitor.deleteMany({ where: { projectId } }),
      prisma.seoAction.deleteMany({ where: { projectId } }),
      prisma.seoProject.update({ where: { id: projectId }, data: { updatedAt: new Date() } }),
      
      prisma.seoKeyword.createMany({
        data: keywords.map(k => ({
          projectId,
          keyword: k.keyword,
          searchVolume: k.searchVolume || 0,
          difficulty: k.difficulty || 0,
          intent: k.intent || 'informational',
          opportunityScore: k.opportunityScore || 0,
          currentRank: Math.floor(Math.random() * 80) + 1,
        }))
      }),
      prisma.seoCompetitor.createMany({
        data: competitors.map(c => ({
          projectId,
          domain: c.domain,
          estimatedTraffic: c.estimatedTraffic || 0,
          domainAuthority: c.domainAuthority || 0,
          topKeywords: c.topKeywords || [],
          strategy: c.strategy || '',
          weaknesses: c.weaknesses || [],
        }))
      }),
      prisma.seoAction.createMany({
        data: actions.map(a => ({
          projectId,
          action: a.action,
          description: a.description || '',
          priority: a.priority || 'medium',
          expectedImpact: a.expectedImpact || '',
          trafficGain: a.trafficGain || 0,
        }))
      }),
    ]);

    const newKeywords = await prisma.seoKeyword.findMany({ where: { projectId } });
    await Promise.all(
      newKeywords.map(kw => 
        prisma.seoRanking.create({
          data: {
            keywordId: kw.id,
            position: kw.currentRank || 50,
            url: `https://mysite.com/solutions/${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          }
        })
      )
    );

    revalidatePath('/marketing/seo');
    return { success: true };
  } catch (error: any) {
    console.error('reAnalyzeProject error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// DATA FETCHERS
// ============================================================

export async function getSeoKeywords(projectId: string) {
  return prisma.seoKeyword.findMany({
    where: { projectId },
    include: { rankings: { orderBy: { recordedAt: 'desc' }, take: 30 } },
    orderBy: { opportunityScore: 'desc' },
  });
}

export async function getSeoCompetitors(projectId: string) {
  return prisma.seoCompetitor.findMany({
    where: { projectId },
    orderBy: { estimatedTraffic: 'desc' },
  });
}

export async function getSeoContentIdeas(projectId: string) {
  const project = await prisma.seoProject.findUnique({
    where: { id: projectId },
    include: { keywords: { take: 6, orderBy: { opportunityScore: 'desc' } } },
  });
  if (!project) return [];

  const ctx = await getBusinessContext();
  const topProducts = ctx.products.slice(0, 4).map(p => p.name);
  const industry = ctx.businessInfo?.industry || project.businessType;

  const prompt = `Generate 8 SEO content ideas for "${project.name}" (${industry}). 
Keywords: ${project.keywords.map(k => k.keyword).join(', ')}.
Return JSON array only.`;

  try {
    const raw = await callGeminiWithRetry(prompt);
    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as SeoContentIdea[];
  } catch {
    return getMockAnalysis({ businessName: project.name, industry, topProducts, competitors: [] }).contentIdeas;
  }
}

export async function getSeoRankings(projectId: string) {
  return prisma.seoKeyword.findMany({
    where: { projectId },
    include: { rankings: { orderBy: { recordedAt: 'asc' }, take: 30 } },
    take: 6,
    orderBy: { opportunityScore: 'desc' },
  });
}

export async function getSeoActions(projectId: string) {
  return prisma.seoAction.findMany({
    where: { projectId },
    orderBy: { trafficGain: 'desc' },
  });
}

export async function toggleSeoAction(id: string, completed: boolean) {
  await prisma.seoAction.update({ where: { id }, data: { completed } });
  revalidatePath('/marketing/seo/actions');
}

export async function runCronUpdate() {
  const rankings = await prisma.seoRanking.findMany({
    orderBy: { recordedAt: 'desc' },
    distinct: ['keywordId'],
    include: { keyword: { select: { id: true, keyword: true } } },
  });

  const alerts: any[] = [];

  await Promise.all(
    rankings.map(async (r) => {
      const drift = Math.floor(Math.random() * 7) - 3;
      const newPos = Math.max(1, Math.min(100, r.position + drift));
      await prisma.seoRanking.create({ 
        data: { keywordId: r.keywordId, position: newPos, url: `https://mysite.com/blog/${r.keyword.keyword.toLowerCase().replace(/\s+/g, '-')}` } 
      });
      await prisma.seoKeyword.update({ where: { id: r.keywordId }, data: { currentRank: newPos } });
      if (newPos - r.position >= 5) {
        alerts.push({ keyword: r.keyword.keyword, previousRank: r.position, newRank: newPos, drop: newPos - r.position });
      }
    })
  );

  return { updated: rankings.length, alerts };
}

export async function getSeoBusinessInfo() {
  return prisma.businessInfo.findUnique({ where: { id: 'singleton' } });
}
