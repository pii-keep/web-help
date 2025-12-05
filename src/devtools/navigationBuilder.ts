/**
 * Navigation Builder Utilities
 * @module @piikeep-pw/web-help/devtools/navigationBuilder
 *
 * Utilities for building navigation structures from manifest and category data.
 */

import type { NavigationItem } from '../core/types/components';
import type { HelpCategory } from '../core/types/content';
import type { ManifestStructure } from './manifestLoader';

/**
 * Build NavigationItem array from manifest structure.
 * Converts manifest categories and articles into navigation items
 * suitable for HelpNavigation component.
 *
 * @param manifest - The manifest structure loaded from manifest.json
 * @returns Array of navigation items with hierarchical structure
 *
 * @example
 * ```typescript
 * const { manifest } = await loadFromManifestFile({
 *   manifestPath: '/help/manifest.json',
 * });
 * const navItems = buildNavigationFromManifest(manifest);
 * ```
 */
export function buildNavigationFromManifest(
  manifest: ManifestStructure,
): NavigationItem[] {
  return manifest.categories
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      id: category.id,
      label: category.title,
      isCategory: true,
      children: category.articles
        ? category.articles
            .sort((a, b) => a.order - b.order)
            .map((article) => ({
              id: article.slug,
              label: article.title,
              path: `#${article.slug}`,
            }))
        : [],
    }));
}

/**
 * Build NavigationItem array from HelpCategory objects.
 * Useful when you have categories loaded from the content loader.
 * Note: This only includes category structure. To include articles,
 * use the contentLoader.getArticlesByCategory() method.
 *
 * @param categories - Array of HelpCategory objects
 * @returns Array of navigation items with category structure
 *
 * @example
 * ```typescript
 * const { contentLoader } = useHelpContext();
 * const categories = contentLoader.getCategories();
 * const navItems = buildNavigationFromCategories(categories);
 * ```
 */
export function buildNavigationFromCategories(
  categories: HelpCategory[],
): NavigationItem[] {
  return categories
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((category) => ({
      id: category.id,
      label: category.name,
      isCategory: true,
      children: [],
    }));
}

/**
 * Build flat NavigationItem array without category grouping.
 * Useful for simple article lists without categories.
 *
 * @param articles - Array of articles with id, title, and optional order
 * @returns Flat array of navigation items
 *
 * @example
 * ```typescript
 * const articles = [
 *   { id: 'intro', title: 'Introduction', order: 1 },
 *   { id: 'guide', title: 'Guide', order: 2 },
 * ];
 * const navItems = buildFlatNavigation(articles);
 * ```
 */
export function buildFlatNavigation(
  articles: Array<{ id: string; title: string; order?: number }>,
): NavigationItem[] {
  return articles
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((article) => ({
      id: article.id,
      label: article.title,
      path: `#${article.id}`,
    }));
}
