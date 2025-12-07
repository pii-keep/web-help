/**
 * Manifest Loader Utilities
 * @module @piikeep/web-help/devtools/manifestLoader
 *
 * Utilities for loading help content from manifest.json files
 */

import type { HelpCategory, HelpConfig } from '../core/types';

/**
 * Structure of a manifest.json file
 */
export interface ManifestStructure {
  /** Title of the help documentation */
  title: string;
  /** Description of the help system */
  description: string;
  /** Version of the manifest */
  version: string;
  /** Categories containing articles */
  categories: Array<{
    id: string;
    title: string;
    description?: string;
    order: number;
    articles?: Array<{
      slug: string;
      title: string;
      filename?: string; // Optional: explicit filename (e.g., 'help_getting_started.md')
      order: number;
    }>;
  }>;
}

/**
 * Options for loading content from a manifest file
 */
export interface LoadManifestOptions {
  /** Base path for manifest.json (default: '/help/manifest.json') */
  manifestPath?: string;
  /** Base path for article files (default: '/help') */
  articlesPath?: string;
  /** File prefix from help.config.ts (default: '') */
  prefix?: string;
  /** File extensions to try for articles (default: ['md']) */
  extensions?: string[];
}

/**
 * Result of loading content from a manifest file
 */
export interface LoadManifestResult {
  /** The parsed manifest structure */
  manifest: ManifestStructure;
  /** Content manifest mapping article IDs to markdown content */
  contentManifest: Record<string, string>;
  /** Processed categories ready for registration */
  categories: HelpCategory[];
}

/**
 * Load help content from a manifest.json file structure.
 * Fetches the manifest and all referenced article files.
 * Supports multiple file formats - tries each extension in order until the file is found.
 *
 * @param options - Configuration options for loading
 * @returns Promise resolving to manifest, content, and categories
 *
 * @example
 * ```typescript
 * // Single format
 * const { contentManifest, categories } = await loadFromManifestFile({
 *   manifestPath: '/help/manifest.json',
 *   articlesPath: '/help',
 *   prefix: 'help_',
 *   extensions: ['md'],
 * });
 *
 * // Multiple formats (tries .mdx first, then .md)
 * const result = await loadFromManifestFile({
 *   manifestPath: '/help/manifest.json',
 *   articlesPath: '/help',
 *   extensions: ['mdx', 'md'],
 * });
 * ```
 */
export async function loadFromManifestFile(
  options: LoadManifestOptions = {},
): Promise<LoadManifestResult> {
  const {
    manifestPath = '/help/manifest.json',
    articlesPath = '/help',
    prefix = '',
    extensions = ['md'],
  } = options;

  // 1. Fetch manifest.json
  const manifestResponse = await fetch(manifestPath);
  if (!manifestResponse.ok) {
    throw new Error(
      `Failed to load manifest from ${manifestPath}: ${manifestResponse.status} ${manifestResponse.statusText}`,
    );
  }
  const manifest: ManifestStructure = await manifestResponse.json();

  // 2. Build content manifest by fetching all article files
  const contentManifest: Record<string, string> = {};
  const categories: HelpCategory[] = [];

  for (const category of manifest.categories) {
    // Register category
    categories.push({
      id: category.id,
      name: category.title,
      description: category.description,
      order: category.order,
    });

    // Fetch each article in the category
    if (category.articles) {
      for (const article of category.articles) {
        let content: string | null = null;

        // If filename is explicitly provided, use it directly
        if (article.filename) {
          const articlePath = `${articlesPath}/${article.filename}`;
          try {
            const response = await fetch(articlePath);
            if (response.ok) {
              content = await response.text();
            } else {
              console.warn(
                `Failed to load article with filename "${article.filename}": ${response.status}`,
              );
            }
          } catch (error) {
            console.warn(
              `Error loading article with filename "${article.filename}":`,
              error,
            );
          }
        } else {
          // Fallback: try each extension until we find the file
          for (const ext of extensions) {
            const filename = prefix
              ? `${prefix}${article.slug}.${ext}`
              : `${article.slug}.${ext}`;
            const articlePath = `${articlesPath}/${filename}`;

            try {
              const response = await fetch(articlePath);
              if (response.ok) {
                content = await response.text();
                break; // Found the file, stop trying other extensions
              }
            } catch {
              // Continue trying other extensions
              continue;
            }
          }
        }

        if (content) {
          contentManifest[article.slug] = content;
        } else {
          const filenameInfo = article.filename
            ? `filename: ${article.filename}`
            : `tried extensions: ${extensions.join(', ')}`;
          console.warn(
            `Failed to load article: ${article.slug} (${filenameInfo})`,
          );
        }
      }
    }
  }

  return { manifest, contentManifest, categories };
}

/**
 * Load help content using settings from help.config
 *
 * @param config - Help configuration object
 * @param manifestPath - Optional override for manifest path
 * @returns Promise resolving to manifest, content, and categories
 *
 * @example
 * ```typescript
 * import helpConfig from './help.config';
 * const { contentManifest } = await loadFromConfig(helpConfig);
 * ```
 */
export async function loadFromConfig(
  config: HelpConfig,
  manifestPath?: string,
): Promise<LoadManifestResult> {
  const basePath = config.content?.path ?? '/help';
  const prefix = config.storage?.prefix ?? '';
  const extensions = config.content?.formats ?? ['md'];

  return loadFromManifestFile({
    manifestPath: manifestPath ?? `${basePath}/manifest.json`,
    articlesPath: basePath,
    prefix,
    extensions,
  });
}

/**
 * Load a single article file from the configured location.
 * Tries multiple extensions until the file is found.
 *
 * @param slug - Article slug/ID
 * @param options - Load options
 * @returns Promise resolving to article content
 *
 * @example
 * ```typescript
 * const content = await loadArticleFile('getting-started', {
 *   articlesPath: '/help',
 *   prefix: 'help_',
 *   extensions: ['md', 'mdx'],
 * });
 * ```
 */
export async function loadArticleFile(
  slug: string,
  options: Omit<LoadManifestOptions, 'manifestPath'> = {},
): Promise<string> {
  const { articlesPath = '/help', prefix = '', extensions = ['md'] } = options;

  // Try each extension until we find the file
  for (const ext of extensions) {
    const filename = prefix ? `${prefix}${slug}.${ext}` : `${slug}.${ext}`;
    const articlePath = `${articlesPath}/${filename}`;

    try {
      const response = await fetch(articlePath);
      if (response.ok) {
        return response.text();
      }
    } catch {
      // Continue trying other extensions
      continue;
    }
  }

  throw new Error(
    `Failed to load article: ${slug} (tried extensions: ${extensions.join(
      ', ',
    )})`,
  );
}
