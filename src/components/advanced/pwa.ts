/**
 * PWA/Offline Support for the Web Help Component Library
 * @module @privify-pw/web-help/components/advanced/pwa
 * 
 * Provides utilities and hooks for Progressive Web App features
 * including offline support, content caching, and update notifications.
 */

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * PWA configuration options.
 */
export interface PWAConfig {
  /** Cache name for help content */
  cacheName?: string;
  /** URLs to cache for offline use */
  offlineUrls?: string[];
  /** Whether to show update notifications */
  showUpdateNotification?: boolean;
  /** Callback when content is cached */
  onCached?: () => void;
  /** Callback when update is available */
  onUpdateAvailable?: () => void;
  /** Callback when offline */
  onOffline?: () => void;
  /** Callback when online */
  onOnline?: () => void;
}

/**
 * PWA status information.
 */
export interface PWAStatus {
  /** Whether the app is online */
  isOnline: boolean;
  /** Whether service worker is supported */
  isSupported: boolean;
  /** Whether service worker is registered */
  isRegistered: boolean;
  /** Whether content is cached */
  isCached: boolean;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Cache storage usage */
  cacheUsage?: CacheUsage;
}

/**
 * Cache usage information.
 */
export interface CacheUsage {
  /** Used storage in bytes */
  used: number;
  /** Total quota in bytes */
  quota: number;
  /** Usage percentage */
  percentage: number;
}

/**
 * Content cache item.
 */
export interface CacheItem {
  /** URL of cached item */
  url: string;
  /** Cache timestamp */
  timestamp: number;
  /** Content type */
  contentType?: string;
  /** Size in bytes */
  size?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CACHE_NAME = 'help-content-v1';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for PWA status and controls.
 */
export function usePWA(config?: PWAConfig): {
  status: PWAStatus;
  cacheContent: (urls: string[]) => Promise<void>;
  clearCache: () => Promise<void>;
  getCachedItems: () => Promise<CacheItem[]>;
  applyUpdate: () => void;
} {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isCached: false,
    updateAvailable: false,
  });

  const cacheName = config?.cacheName ?? DEFAULT_CACHE_NAME;

  // Update online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      config?.onOnline?.();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      config?.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config]);

  // Check service worker registration
  useEffect(() => {
    if (!status.isSupported) return;

    const checkRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        setStatus((prev) => ({ ...prev, isRegistered: !!registration }));

        // Check for updates
        if (registration?.waiting) {
          setStatus((prev) => ({ ...prev, updateAvailable: true }));
          config?.onUpdateAvailable?.();
        }

        // Listen for update events
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setStatus((prev) => ({ ...prev, updateAvailable: true }));
                  config?.onUpdateAvailable?.();
                }
              });
            }
          });
        }
      } catch {
        // Service worker not supported or error
      }
    };

    checkRegistration();
  }, [status.isSupported, config]);

  // Check cache status
  useEffect(() => {
    const checkCache = async () => {
      if (typeof caches === 'undefined') return;

      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        setStatus((prev) => ({ ...prev, isCached: keys.length > 0 }));

        // Get cache usage if available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage;
          const quota = estimate.quota;
          if (used !== undefined && quota !== undefined) {
            setStatus((prev) => ({
              ...prev,
              cacheUsage: {
                used,
                quota,
                percentage: Math.round((used / quota) * 100),
              },
            }));
          }
        }
      } catch {
        // Cache API not supported or error
      }
    };

    checkCache();
  }, [cacheName]);

  // Cache content
  const cacheContent = useCallback(
    async (urls: string[]) => {
      if (typeof caches === 'undefined') {
        throw new Error('Cache API not supported');
      }

      const cache = await caches.open(cacheName);
      await cache.addAll(urls);
      setStatus((prev) => ({ ...prev, isCached: true }));
      config?.onCached?.();
    },
    [cacheName, config]
  );

  // Clear cache
  const clearCache = useCallback(async () => {
    if (typeof caches === 'undefined') {
      throw new Error('Cache API not supported');
    }

    await caches.delete(cacheName);
    setStatus((prev) => ({ ...prev, isCached: false }));
  }, [cacheName]);

  // Get cached items
  const getCachedItems = useCallback(async (): Promise<CacheItem[]> => {
    if (typeof caches === 'undefined') {
      return [];
    }

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    const items: CacheItem[] = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        return {
          url: request.url,
          timestamp: Date.now(), // Note: actual timestamp would need to be stored
          contentType: response?.headers.get('content-type') ?? undefined,
          size: response ? parseInt(response.headers.get('content-length') ?? '0', 10) : undefined,
        };
      })
    );

    return items;
  }, [cacheName]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (!status.updateAvailable) return;

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }, [status.updateAvailable]);

  return {
    status,
    cacheContent,
    clearCache,
    getCachedItems,
    applyUpdate,
  };
}

/**
 * Hook for offline content availability.
 */
export function useOfflineContent(urls: string[]): {
  isAvailable: boolean;
  isCaching: boolean;
  cacheNow: () => Promise<void>;
  error?: string;
} {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (typeof caches === 'undefined') return;

      try {
        const cache = await caches.open(DEFAULT_CACHE_NAME);
        const available = await Promise.all(
          urls.map(async (url) => {
            const response = await cache.match(url);
            return !!response;
          })
        );
        setIsAvailable(available.every(Boolean));
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [urls]);

  // Cache content
  const cacheNow = useCallback(async () => {
    if (typeof caches === 'undefined') {
      setError('Cache API not supported');
      return;
    }

    setIsCaching(true);
    setError(undefined);

    try {
      const cache = await caches.open(DEFAULT_CACHE_NAME);
      await cache.addAll(urls);
      setIsAvailable(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cache content');
    } finally {
      setIsCaching(false);
    }
  }, [urls]);

  return { isAvailable, isCaching, cacheNow, error };
}

// ============================================================================
// Service Worker Registration Helper
// ============================================================================

/**
 * Register service worker for help content.
 */
export async function registerHelpServiceWorker(
  swUrl: string,
  options?: {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
  }
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            options?.onUpdate?.(registration);
          } else {
            // Content cached for offline use
            options?.onSuccess?.(registration);
          }
        }
      });
    });

    return registration;
  } catch (error) {
    options?.onError?.(error instanceof Error ? error : new Error('SW registration failed'));
    return null;
  }
}

/**
 * Unregister service worker.
 */
export async function unregisterHelpServiceWorker(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return registration.unregister();
  }
  return false;
}

// ============================================================================
// Service Worker Template
// ============================================================================

/**
 * Generate service worker script for help content caching.
 * This can be written to a file or used with a blob URL.
 */
export function generateServiceWorkerScript(options?: {
  cacheName?: string;
  urlsToCache?: string[];
}): string {
  const cacheName = options?.cacheName ?? DEFAULT_CACHE_NAME;
  const urlsToCache = options?.urlsToCache ?? [];

  return `
const CACHE_NAME = '${cacheName}';
const URLS_TO_CACHE = ${JSON.stringify(urlsToCache)};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('/offline.html');
      })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
}

export default {
  usePWA,
  useOfflineContent,
  registerHelpServiceWorker,
  unregisterHelpServiceWorker,
  generateServiceWorkerScript,
};
