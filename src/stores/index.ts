import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, ChiaVariant } from '@/types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQty: (productId, qty) =>
        set((state) => ({
          items: qty <= 0
            ? state.items.filter((i) => i.productId !== productId)
            : state.items.map((i) =>
                i.productId === productId ? { ...i, quantity: qty } : i
              ),
        })),

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    }),
    {
      name: 'chiahustle-cart',
    }
  )
);

// ============ UI STORE ============
interface UIStore {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  activeFilters: {
    variant: ChiaVariant | 'all';
    category: string;
    stockStatus: 'all' | 'ok' | 'low' | 'critical';
  };
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = {
  variant: 'all' as ChiaVariant | 'all',
  category: 'all',
  stockStatus: 'all' as const,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      activeFilters: DEFAULT_FILTERS,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setTheme: (theme) => set({ theme }),

      setFilter: (key, value) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, [key]: value },
        })),

      resetFilters: () => set({ activeFilters: DEFAULT_FILTERS }),
    }),
    {
      name: 'chiahustle-ui',
    }
  )
);

// ============ NOTIFICATION STORE ============
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  createdAt: number;
}

interface NotificationStore {
  notifications: Notification[];
  push: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  push: (n) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...n, id: Math.random().toString(36).slice(2), createdAt: Date.now() },
      ],
    })),
  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clear: () => set({ notifications: [] }),
}));
