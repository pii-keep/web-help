/**
 * User Preferences Hook for the Web Help Component Library
 * @module @piikeep-pw/web-help/context/UserPreferencesContext
 *
 * NOTE: This module no longer uses React Context to avoid re-render issues.
 * Instead, it provides a simple hook that reads/writes storage directly.
 */

import { useCallback, useMemo, useRef } from 'react';
import type {
  UserPreferences,
  ReadingHistoryEntry,
  UserSettings,
  StorageAdapter,
} from '../types/storage';
import { createLocalStorageAdapter } from '../storage/localStorage';

/**
 * User preferences return value.
 */
export interface UserPreferencesContextValue {
  /** Current preferences */
  preferences: UserPreferences;
  /** Add a bookmark */
  addBookmark: (articleId: string) => void;
  /** Remove a bookmark */
  removeBookmark: (articleId: string) => void;
  /** Toggle a bookmark */
  toggleBookmark: (articleId: string) => boolean;
  /** Check if an article is bookmarked */
  isBookmarked: (articleId: string) => boolean;
  /** Get all bookmarks */
  getBookmarks: () => string[];
  /** Add to reading history */
  addToHistory: (entry: Omit<ReadingHistoryEntry, 'timestamp'>) => void;
  /** Get reading history */
  getHistory: (limit?: number) => ReadingHistoryEntry[];
  /** Clear reading history */
  clearHistory: () => void;
  /** Update reading progress */
  updateProgress: (articleId: string, progress: number) => void;
  /** Get reading progress */
  getProgress: (articleId: string) => number;
  /** Add a recent search */
  addRecentSearch: (query: string) => void;
  /** Get recent searches */
  getRecentSearches: () => string[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Update user settings */
  updateSettings: (settings: Partial<UserSettings>) => void;
  /** Get user settings */
  getSettings: () => UserSettings;
}

/**
 * Storage keys for user preferences.
 */
const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarks',
  HISTORY: 'history',
  PROGRESS: 'progress',
  RECENT_SEARCHES: 'recent_searches',
  SETTINGS: 'settings',
} as const;

/**
 * Default max history entries.
 */
const MAX_HISTORY_ENTRIES = 50;

/**
 * Default max recent searches.
 */
const MAX_RECENT_SEARCHES = 10;

/**
 * Helper to read from storage.
 */
function readFromStorage<T>(
  storage: StorageAdapter,
  key: string,
  defaultValue: T,
): T {
  const value = storage.get<T>(key);
  return value ?? defaultValue;
}

/**
 * Hook to access user preferences.
 *
 * This hook reads/writes storage directly instead of using Context,
 * which avoids infinite re-render loops caused by context value changes.
 *
 * All callbacks use refs for complete stability - empty dependency arrays.
 *
 * @param storage - Optional storage adapter. Defaults to LocalStorageAdapter.
 * @param callbacks - Optional callbacks for bookmark/history events.
 */
export function useUserPreferences(
  storage?: StorageAdapter,
  callbacks?: {
    onBookmark?: (articleId: string, bookmarked: boolean) => void;
    onHistory?: (entry: ReadingHistoryEntry) => void;
  },
): UserPreferencesContextValue {
  // Use default localStorage adapter if none provided
  const defaultStorage = useMemo(() => createLocalStorageAdapter(), []);

  // Store in refs to prevent any dependency changes
  const storageRef = useRef(storage ?? defaultStorage);
  const callbacksRef = useRef(callbacks);

  // Update refs when params change (but don't trigger re-renders)
  storageRef.current = storage ?? defaultStorage;
  callbacksRef.current = callbacks;

  // Read current preferences from storage - completely stable, runs once
  const preferences = useMemo((): UserPreferences => {
    return {
      bookmarks: readFromStorage<string[]>(
        storageRef.current,
        STORAGE_KEYS.BOOKMARKS,
        [],
      ),
      history: readFromStorage<ReadingHistoryEntry[]>(
        storageRef.current,
        STORAGE_KEYS.HISTORY,
        [],
      ),
      readingProgress: readFromStorage<Record<string, number>>(
        storageRef.current,
        STORAGE_KEYS.PROGRESS,
        {},
      ),
      recentSearches: readFromStorage<string[]>(
        storageRef.current,
        STORAGE_KEYS.RECENT_SEARCHES,
        [],
      ),
      settings: readFromStorage<UserSettings>(
        storageRef.current,
        STORAGE_KEYS.SETTINGS,
        {},
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bookmark functions - all use refs, empty deps
  const addBookmark = useCallback((articleId: string) => {
    const bookmarks = readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.BOOKMARKS,
      [],
    );
    if (!bookmarks.includes(articleId)) {
      const newBookmarks = [...bookmarks, articleId];
      storageRef.current.set(STORAGE_KEYS.BOOKMARKS, newBookmarks);
      callbacksRef.current?.onBookmark?.(articleId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeBookmark = useCallback((articleId: string) => {
    const bookmarks = readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.BOOKMARKS,
      [],
    );
    const newBookmarks = bookmarks.filter((id) => id !== articleId);
    storageRef.current.set(STORAGE_KEYS.BOOKMARKS, newBookmarks);
    callbacksRef.current?.onBookmark?.(articleId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleBookmark = useCallback(
    (articleId: string): boolean => {
      const bookmarks = readFromStorage<string[]>(
        storageRef.current,
        STORAGE_KEYS.BOOKMARKS,
        [],
      );
      const isCurrentlyBookmarked = bookmarks.includes(articleId);

      if (isCurrentlyBookmarked) {
        removeBookmark(articleId);
        return false;
      } else {
        addBookmark(articleId);
        return true;
      }
    },
    [addBookmark, removeBookmark],
  );

  const isBookmarked = useCallback((articleId: string): boolean => {
    const bookmarks = readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.BOOKMARKS,
      [],
    );
    return bookmarks.includes(articleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBookmarks = useCallback((): string[] => {
    return readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.BOOKMARKS,
      [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // History functions
  const addToHistory = useCallback(
    (entry: Omit<ReadingHistoryEntry, 'timestamp'>) => {
      const history = readFromStorage<ReadingHistoryEntry[]>(
        storageRef.current,
        STORAGE_KEYS.HISTORY,
        [],
      );

      // Remove existing entry for this article
      const filteredHistory = history.filter(
        (h) => h.articleId !== entry.articleId,
      );

      // Add new entry at the beginning
      const newEntry: ReadingHistoryEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };

      const newHistory = [newEntry, ...filteredHistory].slice(
        0,
        MAX_HISTORY_ENTRIES,
      );
      storageRef.current.set(STORAGE_KEYS.HISTORY, newHistory);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const getHistory = useCallback((limit?: number): ReadingHistoryEntry[] => {
    const history = readFromStorage<ReadingHistoryEntry[]>(
      storageRef.current,
      STORAGE_KEYS.HISTORY,
      [],
    );
    return limit ? history.slice(0, limit) : history;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearHistory = useCallback(() => {
    storageRef.current.set(STORAGE_KEYS.HISTORY, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reading progress functions
  const updateProgress = useCallback((articleId: string, progress: number) => {
    const progressMap = readFromStorage<Record<string, number>>(
      storageRef.current,
      STORAGE_KEYS.PROGRESS,
      {},
    );
    progressMap[articleId] = Math.min(100, Math.max(0, progress));
    storageRef.current.set(STORAGE_KEYS.PROGRESS, progressMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProgress = useCallback((articleId: string): number => {
    const progressMap = readFromStorage<Record<string, number>>(
      storageRef.current,
      STORAGE_KEYS.PROGRESS,
      {},
    );
    return progressMap[articleId] ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recent searches functions
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    const searches = readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.RECENT_SEARCHES,
      [],
    );

    // Remove duplicate and add at the beginning
    const filtered = searches.filter(
      (s) => s.toLowerCase() !== query.toLowerCase(),
    );
    const newSearches = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    storageRef.current.set(STORAGE_KEYS.RECENT_SEARCHES, newSearches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRecentSearches = useCallback((): string[] => {
    return readFromStorage<string[]>(
      storageRef.current,
      STORAGE_KEYS.RECENT_SEARCHES,
      [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearRecentSearches = useCallback(() => {
    storageRef.current.set(STORAGE_KEYS.RECENT_SEARCHES, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settings functions
  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    const currentSettings = readFromStorage<UserSettings>(
      storageRef.current,
      STORAGE_KEYS.SETTINGS,
      {},
    );
    const newSettings = { ...currentSettings, ...settings };
    storageRef.current.set(STORAGE_KEYS.SETTINGS, newSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSettings = useCallback((): UserSettings => {
    return readFromStorage<UserSettings>(
      storageRef.current,
      STORAGE_KEYS.SETTINGS,
      {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    preferences,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    getBookmarks,
    addToHistory,
    getHistory,
    clearHistory,
    updateProgress,
    getProgress,
    addRecentSearch,
    getRecentSearches,
    clearRecentSearches,
    updateSettings,
    getSettings,
  };
}

/**
 * Legacy provider component for backward compatibility.
 * This is now a no-op wrapper that just renders children.
 *
 * @deprecated No longer needed. You can remove <UserPreferencesProvider>
 * from your component tree and just use useUserPreferences() hook directly.
 */
export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
