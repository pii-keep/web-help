/**
 * useHelpNavigation Hook for the Web Help Component Library
 * @module @piikeep-pw/web-help/hooks/useHelpNavigation
 */

import { useCallback, useMemo } from 'react';
import { useHelpContext, useHelpState } from '../context/HelpContext';
import type {
  NavigationState,
  BreadcrumbItem,
  HelpCategory,
} from '../types/content';

/**
 * Return type for useHelpNavigation hook.
 */
export interface UseHelpNavigationReturn {
  /** Current navigation state */
  navigation: NavigationState;
  /** Go to previous article */
  goToPrev: () => Promise<void>;
  /** Go to next article */
  goToNext: () => Promise<void>;
  /** Whether there is a previous article */
  hasPrev: boolean;
  /** Whether there is a next article */
  hasNext: boolean;
  /** Get breadcrumb trail for current article */
  getBreadcrumbs: () => BreadcrumbItem[];
  /** Get available categories */
  categories: HelpCategory[];
  /**
   * Navigate to a category. This is a no-op by default and should be
   * overridden by the consuming application to handle category navigation.
   */
  goToCategory: (categoryId: string) => void;
}

/**
 * Hook for navigation functionality.
 */
export function useHelpNavigation(): UseHelpNavigationReturn {
  const { navigateToArticle, contentLoader } = useHelpContext();
  const state = useHelpState();

  const hasPrev = !!state.navigation.prev;
  const hasNext = !!state.navigation.next;

  const goToPrev = useCallback(async () => {
    if (state.navigation.prev) {
      await navigateToArticle(state.navigation.prev.id);
    }
  }, [navigateToArticle, state.navigation.prev]);

  const goToNext = useCallback(async () => {
    if (state.navigation.next) {
      await navigateToArticle(state.navigation.next.id);
    }
  }, [navigateToArticle, state.navigation.next]);

  const getBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    const article = state.currentArticle;

    if (!article) return breadcrumbs;

    // Add home
    breadcrumbs.push({ label: 'Home', path: '/', id: 'home' });

    // Add category if exists
    if (article.metadata.category) {
      const category = contentLoader.getCategory(article.metadata.category);
      if (category) {
        breadcrumbs.push({
          label: category.name,
          path: `/category/${category.id}`,
          id: category.id,
        });
      }
    }

    // Add current article
    breadcrumbs.push({
      label: article.title,
      id: article.id,
      current: true,
    });

    return breadcrumbs;
  }, [state.currentArticle, contentLoader]);

  /**
   * Navigate to a category. By default, this is a no-op as category navigation
   * should be handled by the consuming application's routing system.
   * Override this behavior by implementing your own navigation logic.
   */
  const goToCategory = useCallback((categoryId: string) => {
    // Category navigation is intentionally left as a no-op.
    // This function provides a hook point for developers to implement
    // their own category navigation logic based on their routing setup.
    void categoryId;
  }, []);

  const categories = useMemo(() => {
    return contentLoader.getCategories();
  }, [contentLoader]);

  return {
    navigation: state.navigation,
    goToPrev,
    goToNext,
    hasPrev,
    hasNext,
    getBreadcrumbs,
    categories,
    goToCategory,
  };
}
