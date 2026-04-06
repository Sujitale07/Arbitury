import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiStoreState {
  tokensUsed: number;
  tokenLimit: number;
  isLimitReached: boolean;
  setLimit: (limit: number) => void;
  consumeTokens: (amount?: number) => void;
  resetTokens: () => void;
}

export const useApiStore = create<ApiStoreState>()(
  persist(
    (set, get) => ({
      tokensUsed: 0,
      tokenLimit: 5000, // Default limit, configurable
      isLimitReached: false,

      setLimit: (limit: number) => {
        set((state) => ({
          tokenLimit: limit,
          isLimitReached: state.tokensUsed >= limit,
        }));
      },

      consumeTokens: (amount = 1) => {
        set((state) => {
          const newUsed = state.tokensUsed + amount;
          return {
            tokensUsed: newUsed,
            isLimitReached: newUsed >= state.tokenLimit,
          };
        });
      },

      resetTokens: () => {
        set({ tokensUsed: 0, isLimitReached: false });
      },
    }),
    {
      name: 'api-token-storage', // persists UI state in localStorage
    }
  )
);
