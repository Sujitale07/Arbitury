import { useApiStore } from '@/stores/apiStore';

export interface ApiManagerOptions {
  cacheDurationMs?: number;
  costInTokens?: number;
  dedupeMs?: number;
  /** Isolate cache/dedupe per workspace (and per resource when needed). */
  cacheScope?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  fromCache: boolean;
  success: boolean;
  error?: string;
  isLimitReached?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

class ApiManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private storageKey = 'app-api-cache';

  constructor() {
    this.hydrateCache();
  }

  /**
   * Load persist cache from localStorage to memory
   */
  private hydrateCache() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.memoryCache.set(key, value as CacheEntry);
        });
      }
    } catch (e) {
      console.warn('Failed to parse API cache', e);
    }
  }

  /**
   * Persist current memory cache to localStorage
   */
  private persistCache() {
    if (typeof window === 'undefined') return;
    try {
      const obj = Object.fromEntries(this.memoryCache);
      localStorage.setItem(this.storageKey, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save API cache', e);
    }
  }

  /**
   * Generates a unique key for the request (endpoint + body)
   */
  private generateCacheKey(endpoint: string, options?: RequestInit): string {
    const bodyStr = options?.body ? options.body.toString() : '';
    return `${endpoint}_${options?.method || 'GET'}_${bodyStr}`;
  }

  /**
   * Get valid data from cache
   */
  private getValidCache(key: string, ttl: number): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.memoryCache.delete(key);
      this.persistCache();
      return null;
    }
    return entry.data;
  }

  /**
   * Check token limitations from Zustand store
   */
  private checkLimit(cost: number): boolean {
    const store = useApiStore.getState();
    // If the next request exceeds the limit, block it.
    if (store.tokensUsed + cost > store.tokenLimit) {
      store.consumeTokens(cost); // Consumes so state reacts immediately
      return true; // Limit Reached
    }
    return false;
  }

  /**
   * Perform fetch with guard, caching, deduping, and fallback
   */
  public async fetch<T>(endpoint: string, fetchOptions?: RequestInit, config?: ApiManagerOptions): Promise<ApiResponse<T>> {
    const cost = config?.costInTokens || 1;
    const cacheTtl = config?.cacheDurationMs || 5 * 60 * 1000; // 5 min default
    const dedupeTtl = config?.dedupeMs || 1000;

    const cacheKey = this.generateCacheKey(endpoint, fetchOptions);

    // 1. Check for valid cache first (avoids limit check if cached correctly)
    const cachedData = this.getValidCache(cacheKey, cacheTtl);
    if (cachedData) {
      return { success: true, data: cachedData, fromCache: true };
    }

    // 2. Token Limit Check Enforced
    if (this.checkLimit(cost)) {
      // Fallback mechanism: Attempt to return stale cache if available when limit is reached
      const staleData = this.memoryCache.get(cacheKey)?.data;
      if (staleData) {
        return { 
          success: true, 
          data: staleData, 
          fromCache: true, 
          isLimitReached: true,
          error: 'API limit reached. Serving stale cached data.' 
        };
      }
      return { 
        success: false, 
        data: null, 
        fromCache: false, 
        isLimitReached: true,
        error: 'API limit reached. No cached data available.' 
      };
    }

    // 3. Deduplication: Check if there's an ongoing identical request
    if (this.pendingRequests.has(cacheKey)) {
      try {
        const data = await this.pendingRequests.get(cacheKey);
        return { success: true, data, fromCache: true }; // Consider deduped request as "cached"/fast return
      } catch (e) {
        // Fallthrough on dedupe fail
      }
    }

    // 4. Perform actual API Request
    const requestPromise = (async () => {
      const res = await fetch(endpoint, fetchOptions);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return await res.json();
    })();

    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      
      // Consume tokens ONLY upon successful request initialization
      useApiStore.getState().consumeTokens(cost);

      // Cache the result
      this.memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      this.persistCache();

      return { success: true, data, fromCache: false };
    } catch (err: any) {
      // Fallback on error if there's any stale cache
      const staleData = this.memoryCache.get(cacheKey)?.data;
      if (staleData) {
        return { 
          success: true, 
          data: staleData, 
          fromCache: true,
          error: 'API failed. Served cached data as fallback.' 
        };
      }
      return { success: false, data: null, fromCache: false, error: err.message };
    } finally {
      // Cleanup deduplication
      setTimeout(() => {
        this.pendingRequests.delete(cacheKey);
      }, dedupeTtl);
    }
  }

  /**
   * Clear Specific Cache
   */
  public clearCache(endpoint: string) {
    for (const key of this.memoryCache.keys()) {
      if (key.includes(endpoint)) {
        this.memoryCache.delete(key);
      }
    }
    this.persistCache();
  }

  /**
   * Execute an arbitrary Promise-based action (Server Action) with guard, caching, and fallback
   */
  public async execute<T>(actionName: string, actionFn: () => Promise<T>, config?: ApiManagerOptions): Promise<T> {
    const cost = config?.costInTokens || 1;
    const cacheTtl = config?.cacheDurationMs || 5 * 60 * 1000;
    const dedupeTtl = config?.dedupeMs || 1000;
    const scope = config?.cacheScope ?? 'global';
    const cacheKey = `action_${actionName}_${scope}`;

    // 1. Check valid cache
    const cachedData = this.getValidCache(cacheKey, cacheTtl);
    if (cachedData) return cachedData;

    // 2. Token Limit
    if (this.checkLimit(cost)) {
      const staleData = this.memoryCache.get(cacheKey)?.data;
      if (staleData) {
        console.warn(`[ApiManager] Limit reached. Serving stale cache for ${actionName}`);
        return staleData;
      }
      throw new Error(`API limit reached. No cached data available for ${actionName}.`);
    }

    // 3. Deduplicate
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // 4. Perform Action
    const requestPromise = actionFn();
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      useApiStore.getState().consumeTokens(cost);
      this.memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      this.persistCache();
      return data;
    } catch (err: any) {
      const staleData = this.memoryCache.get(cacheKey)?.data;
      if (staleData) {
         console.warn(`[ApiManager] Fetch failed. Serving stale cache for ${actionName}`);
         return staleData;
      }
      throw err;
    } finally {
      setTimeout(() => {
        this.pendingRequests.delete(cacheKey);
      }, dedupeTtl);
    }
  }
}

// Export singleton instance
export const apiManager = new ApiManager();
