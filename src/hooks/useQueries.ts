'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as seoActions from '@/lib/actions/seo';
import * as aiActions from '@/lib/actions/ai';
import * as productActions from '@/lib/actions/products';
import * as customerActions from '@/lib/actions/customers';
import * as orderActions from '@/lib/actions/orders';
import * as marketingActions from '@/lib/actions/marketing';
import * as dashboardActions from '@/lib/actions/dashboard';
import * as settingsActions from '@/lib/actions/settings';
import { SeoProjectInput } from '@/lib/actions/seo';
import { apiManager } from '@/lib/apiManager';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      return data.workspaces as Array<{ id: string; name: string }>;
    },
  });
}

const S = (workspaceId: string) => ({ cacheScope: workspaceId });
const SP = (workspaceId: string, projectId: string) => ({ cacheScope: `${workspaceId}:${projectId}` });

export const SEO_QK = {
  projects: (workspaceId: string) => ['seo', 'projects', workspaceId] as const,
  keywords: (workspaceId: string, projectId?: string | null) =>
    ['seo', 'keywords', workspaceId, projectId] as const,
  rankings: (workspaceId: string, projectId?: string | null) =>
    ['seo', 'rankings', workspaceId, projectId] as const,
  competitors: (workspaceId: string, projectId?: string | null) =>
    ['seo', 'competitors', workspaceId, projectId] as const,
  content: (workspaceId: string, projectId?: string | null) =>
    ['seo', 'content', workspaceId, projectId] as const,
  actions: (workspaceId: string, projectId?: string | null) =>
    ['seo', 'actions', workspaceId, projectId] as const,
  business: (workspaceId: string) => ['seo', 'business', workspaceId] as const,
};

export function useSeoProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.projects(workspaceId) : ['seo', 'projects', 'none'],
    queryFn: () =>
      apiManager.execute('getSeoProjects', () => seoActions.getSeoProjects(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useDeleteSeoProject(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return seoActions.deleteSeoProject(workspaceId, id);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: SEO_QK.projects(workspaceId) });
    },
  });
}

export function useSeoKeywords(workspaceId: string | undefined, projectId?: string | null) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.keywords(workspaceId, projectId) : ['seo', 'keywords', 'none'],
    queryFn: () =>
      projectId && workspaceId
        ? apiManager.execute('getSeoKeywords', () => seoActions.getSeoKeywords(workspaceId, projectId), SP(workspaceId, projectId))
        : Promise.resolve([]),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useAnalyzeSeo(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SeoProjectInput) => {
      if (!workspaceId) throw new Error('Workspace required');
      return apiManager.execute('analyzeSeo', () => seoActions.analyzeSeo(workspaceId, input), {
        costInTokens: 50,
        ...S(workspaceId),
      });
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: SEO_QK.projects(workspaceId) });
    },
  });
}

export function useReAnalyzeSeo(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return apiManager.execute('reAnalyzeProject', () => seoActions.reAnalyzeProject(workspaceId, projectId), {
        costInTokens: 25,
        ...SP(workspaceId, projectId),
      });
    },
    onSuccess: (_, projectId) => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: SEO_QK.keywords(workspaceId, projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.competitors(workspaceId, projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.actions(workspaceId, projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.rankings(workspaceId, projectId) });
    },
  });
}

export function useSeoRankings(workspaceId: string | undefined, projectId?: string | null) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.rankings(workspaceId, projectId) : ['seo', 'rankings', 'none'],
    queryFn: () =>
      projectId && workspaceId
        ? apiManager.execute('getSeoRankings', () => seoActions.getSeoRankings(workspaceId, projectId), SP(workspaceId, projectId))
        : Promise.resolve([]),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useSeoCompetitors(workspaceId: string | undefined, projectId?: string | null) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.competitors(workspaceId, projectId) : ['seo', 'competitors', 'none'],
    queryFn: () =>
      projectId && workspaceId
        ? apiManager.execute('getSeoCompetitors', () => seoActions.getSeoCompetitors(workspaceId, projectId), SP(workspaceId, projectId))
        : Promise.resolve([]),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useSeoContentIdeas(workspaceId: string | undefined, projectId?: string | null) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.content(workspaceId, projectId) : ['seo', 'content', 'none'],
    queryFn: () =>
      projectId && workspaceId
        ? apiManager.execute('getSeoContentIdeas', () => seoActions.getSeoContentIdeas(workspaceId, projectId), SP(workspaceId, projectId))
        : Promise.resolve([]),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useSeoActions(workspaceId: string | undefined, projectId?: string | null) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.actions(workspaceId, projectId) : ['seo', 'actions', 'none'],
    queryFn: () =>
      projectId && workspaceId
        ? apiManager.execute('getSeoActions', () => seoActions.getSeoActions(workspaceId, projectId), SP(workspaceId, projectId))
        : Promise.resolve([]),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useToggleSeoAction(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return seoActions.toggleSeoAction(workspaceId, id, completed);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['seo', 'actions', workspaceId] });
    },
  });
}

export function useSeoBusinessInfo(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? SEO_QK.business(workspaceId) : ['seo', 'business', 'none'],
    queryFn: () =>
      apiManager.execute('getSeoBusinessInfo', () => seoActions.getSeoBusinessInfo(workspaceId!), S(workspaceId!)) as any,
    enabled: !!workspaceId,
    staleTime: 5 * 60_000,
  });
}

export function useDashboardMetrics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', workspaceId],
    queryFn: () =>
      apiManager.execute('getDashboardMetrics', () => dashboardActions.getDashboardMetrics(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
    refetchInterval: 5 * 60_000,
  });
}

export function useAIInsights(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['insights', workspaceId],
    queryFn: () =>
      apiManager.execute('getAIInsights', () => aiActions.getAIInsights(workspaceId!), { costInTokens: 10, ...S(workspaceId!) }),
    enabled: !!workspaceId,
    refetchInterval: 60 * 60_000,
  });
}

export function useBusinessInfo(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['businessInfo', workspaceId],
    queryFn: () => apiManager.execute('getBusinessInfo', () => settingsActions.getBusinessInfo(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useProducts(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['products', workspaceId],
    queryFn: () => apiManager.execute('getProducts', () => productActions.getProducts(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useCustomers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['customers', workspaceId],
    queryFn: () => apiManager.execute('getCustomers', () => customerActions.getCustomers(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useOrders(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['orders', workspaceId],
    queryFn: () => apiManager.execute('getOrders', () => orderActions.getOrders(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useCampaigns(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: () =>
      apiManager.execute('getCampaignHistory', () => marketingActions.getCampaignHistory(workspaceId!), S(workspaceId!)),
    enabled: !!workspaceId,
  });
}

export function useCreateProduct(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (!workspaceId) throw new Error('Workspace required');
      return productActions.createProduct(workspaceId, data);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['products', workspaceId] });
    },
  });
}

export function useUpdateProduct(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return productActions.updateProduct(workspaceId, id, data);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['products', workspaceId] });
    },
  });
}

export function useDeleteProduct(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return productActions.deleteProduct(workspaceId, id);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['products', workspaceId] });
    },
  });
}

export function useUpdateCustomerSegment(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, segment }: { id: string; segment: any }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return customerActions.updateCustomerSegment(workspaceId, id, segment);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['customers', workspaceId] });
    },
  });
}

export function useUpdateCustomer(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return customerActions.updateCustomer(workspaceId, id, data);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['customers', workspaceId] });
    },
  });
}

export function useDeleteCustomer(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return customerActions.deleteCustomer(workspaceId, id);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: ['customers', workspaceId] });
      qc.invalidateQueries({ queryKey: ['orders', workspaceId] });
    },
  });
}

export function useCreateCampaign(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (!workspaceId) throw new Error('Workspace required');
      return marketingActions.createCampaign(workspaceId, data);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
    },
  });
}

export function useGenerateCampaign(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (prompt: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return apiManager.execute(
        'generateCampaignContent',
        () => marketingActions.generateCampaignContent(workspaceId, prompt),
        { costInTokens: 15, ...S(workspaceId) },
      );
    },
  });
}

export function useSendCampaign(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!workspaceId) throw new Error('Workspace required');
      return marketingActions.sendCampaign(workspaceId, id);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
    },
  });
}

export function useCheckoutManualOrder(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutData, cartItems }: { checkoutData: any; cartItems: any[] }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return orderActions.checkoutManualOrder(workspaceId, checkoutData, cartItems);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: ['orders', workspaceId] });
    },
  });
}

export function useRecordManualSale(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (!workspaceId) throw new Error('Workspace required');
      return orderActions.recordManualSale(workspaceId, data);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: ['orders', workspaceId] });
      qc.invalidateQueries({ queryKey: ['products', workspaceId] });
    },
  });
}

export function useUpdateOrderStatus(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => {
      if (!workspaceId) throw new Error('Workspace required');
      return orderActions.updateOrderStatus(workspaceId, id, status);
    },
    onSuccess: () => {
      if (workspaceId) qc.invalidateQueries({ queryKey: ['orders', workspaceId] });
    },
  });
}

export function useUpdateBusinessInfo(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (!workspaceId) throw new Error('Workspace required');
      return settingsActions.updateBusinessInfo(workspaceId, data);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      qc.invalidateQueries({ queryKey: ['businessInfo', workspaceId] });
      qc.invalidateQueries({ queryKey: SEO_QK.business(workspaceId) });
    },
  });
}
