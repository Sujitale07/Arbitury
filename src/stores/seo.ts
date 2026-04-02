import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SeoStore {
  // Project management
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;

  // Global loading state for AI analysis
  analysisLoading: boolean;
  setAnalysisLoading: (loading: boolean) => void;

  // Content ideas (stored in memory since not in DB)
  contentIdeas: any[];
  setContentIdeas: (ideas: any[]) => void;
}

export const useSeoStore = create<SeoStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProject: (id) => set({ activeProjectId: id }),

      analysisLoading: false,
      setAnalysisLoading: (loading) => set({ analysisLoading: loading }),

      contentIdeas: [],
      setContentIdeas: (ideas) => set({ contentIdeas: ideas }),
    }),
    {
      name: 'arbitury-seo',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }), // only persist project selection
    }
  )
);
