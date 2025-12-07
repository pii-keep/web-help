/**
 * useHelpNavigation Hook for the Web Help Component Library
 * @module @piikeep-pw/web-help/hooks/useHelpNavigation
 */

import { useCallback } from 'react';
import { useHelp } from '../context/HelpProvider';
import type { BreadcrumbItem, HelpCategory } from '../types/content';

/**
 * Return type for useHelpNavigation hook.
 */
export interface UseHelpNavigationReturn {
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
  const { navigation, categories, loadArticle, currentArticle } = useHelp();

  const hasPrev = !!navigation?.previous;
  const hasNext = !!navigation?.next;

  const goToPrev = useCallback(async () => {
    if (navigation?.previous) {
      await loadArticle(navigation.previous.id);
    }
  }, [navigation, loadArticle]);

  const goToNext = useCallback(async () => {
    if (navigation?.next) {
      await loadArticle(navigation.next.id);
    }
  }, [navigation, loadArticle]);

  const getBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    if (!currentArticle) return breadcrumbs;

    // Add home
    breadcrumbs.push({ label: 'Home', path: '/', id: 'home' });

    // Add category if exists
    if (currentArticle.metadata.category) {
      const category = categories.find(
        (cat) => cat.id === currentArticle.metadata.category,
      );
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
      label: currentArticle.title,
      id: currentArticle.id,
      current: true,
    });

    return breadcrumbs;
  }, [currentArticle, categories]);

  const goToCategory = useCallback((categoryId: string) => {
    // No-op by default - applications should override this
    console.warn(
      `goToCategory called with ${categoryId} but no handler is configured`,
    );
  }, []);

  return {
    goToPrev,
    goToNext,
    hasPrev,
    hasNext,
    getBreadcrumbs,
    categories,
    goToCategory,
  };
}
