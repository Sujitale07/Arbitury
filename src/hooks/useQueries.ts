'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as seoActions from '@/lib/actions/seo';
import * as aiActions from '@/lib/actions/ai';
import * as productActions from '@/lib/actions/products';
import * as customerActions from '@/lib/actions/customers';
import * as orderActions from '@/lib/actions/orders';
import * as marketingActions from '@/lib/actions/marketing';
import * as dashboardActions from '@/lib/actions/dashboard';
import { SeoProjectInput } from '@/lib/actions/seo';

// ============================================================
// SEO MODULE HOOKS
// ============================================================

export const SEO_QK = {
  projects: ['seo', 'projects'],
  keywords: (projectId?: string | null) => ['seo', 'keywords', projectId],
  rankings: (projectId?: string | null) => ['seo', 'rankings', projectId],
  competitors: (projectId?: string | null) => ['seo', 'competitors', projectId],
  content: (projectId?: string | null) => ['seo', 'content', projectId],
  actions: (projectId?: string | null) => ['seo', 'actions', projectId],
  business: ['seo', 'business'],
};

export function useSeoProjects() {
  return useQuery({
    queryKey: SEO_QK.projects,
    queryFn: () => seoActions.getSeoProjects(),
  });
}

export function useDeleteSeoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seoActions.deleteSeoProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEO_QK.projects });
    },
  });
}

export function useSeoKeywords(projectId?: string | null) {
  return useQuery({
    queryKey: SEO_QK.keywords(projectId),
    queryFn: () => projectId ? seoActions.getSeoKeywords(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });
}

export function useAnalyzeSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SeoProjectInput) => seoActions.analyzeSeo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEO_QK.projects });
    },
  });
}

export function useReAnalyzeSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => seoActions.reAnalyzeProject(projectId),
    onSuccess: (_, projectId) => {
      qc.invalidateQueries({ queryKey: SEO_QK.keywords(projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.competitors(projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.actions(projectId) });
      qc.invalidateQueries({ queryKey: SEO_QK.rankings(projectId) });
    },
  });
}

export function useSeoRankings(projectId?: string | null) {
  return useQuery({
    queryKey: SEO_QK.rankings(projectId),
    queryFn: () => projectId ? seoActions.getSeoRankings(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });
}

export function useSeoCompetitors(projectId?: string | null) {
  return useQuery({
    queryKey: SEO_QK.competitors(projectId),
    queryFn: () => projectId ? seoActions.getSeoCompetitors(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });
}

export function useSeoContentIdeas(projectId?: string | null) {
  return useQuery({
    queryKey: SEO_QK.content(projectId),
    queryFn: () => projectId ? seoActions.getSeoContentIdeas(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });
}

export function useSeoActions(projectId?: string | null) {
  return useQuery({
    queryKey: SEO_QK.actions(projectId),
    queryFn: () => projectId ? seoActions.getSeoActions(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });
}

export function useToggleSeoAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => 
      seoActions.toggleSeoAction(id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo', 'actions'] });
    },
  });
}

export function useSeoBusinessInfo() {
  return useQuery({
    queryKey: SEO_QK.business,
    queryFn: () => seoActions.getSeoBusinessInfo() as any,
    staleTime: 5 * 60_000,
  });
}

// ============================================================
// CORE DASHBOARD & INVENTORY HOOKS
// ============================================================

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardActions.getDashboardMetrics(),
    refetchInterval: 5 * 60_000,
  });
}

export function useAIInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => aiActions.getAIInsights(),
    refetchInterval: 60 * 60_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productActions.getProducts(),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerActions.getCustomers(),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => orderActions.getOrders(),
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => marketingActions.getCampaignHistory(),
  });
}

// ============================================================
// MUTATIONS
// ============================================================

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => productActions.createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productActions.updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productActions.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateCustomerSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, segment }: { id: string; segment: any }) => 
      customerActions.updateCustomerSegment(id, segment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => marketingActions.createCampaign(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useGenerateCampaign() {
  return useMutation({
    mutationFn: (prompt: string) => marketingActions.generateCampaignContent(prompt),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketingActions.sendCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useCheckoutManualOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutData, cartItems }: { checkoutData: any; cartItems: any[] }) => 
      orderActions.checkoutManualOrder(checkoutData, cartItems),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useRecordManualSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => orderActions.recordManualSale(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => 
      orderActions.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
