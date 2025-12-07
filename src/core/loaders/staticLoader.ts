/**
 * Static Content Loader for the Web Help Component Library
 * @module @piikeep-pw/web-help/loaders/staticLoader
 */

import type { HelpArticle, HelpCategory, ContentIndex } from '../types/content';
import type { ContentConfig, CacheConfig } from '../types/config';
import type { ContentParser, ParseResult } from '../types/parser';

/**
 * Content registry for caching loaded articles.
 */
interface ContentRegistry {
  articles: Map<string, HelpArticle>;
  categories: Map<string, HelpCategory>;
  index: ContentIndex[];
  lastUpdated: number;
}

/**
 * Static content loader for loading help articles from static files.
 */
export class StaticContentLoader {
  private registry: ContentRegistry;
  private parsers: Map<string, ContentParser>;
  private config: ContentConfig;
  private cacheConfig: CacheConfig;

  constructor(config: ContentConfig = {}) {
    this.config = config;
    this.cacheConfig = config.cache ?? { enabled: true, ttl: 5 * 60 * 1000 }; // 5 min default
    this.registry = {
      articles: new Map(),
      categories: new Map(),
      index: [],
      lastUpdated: 0,
    };
    this.parsers = new Map();
  }

  /**
   * Register a content parser.
   * @param parser - Parser to register
   */
  registerParser(parser: ContentParser): void {
    for (const ext of parser.extensions) {
      this.parsers.set(ext, parser);
    }
  }

  /**
   * Get a parser for the given file extension.
   * @param extension - File extension
   * @returns Content parser or undefined
   */
  getParser(extension: string): ContentParser | undefined {
    return this.parsers.get(extension.toLowerCase().replace('.', ''));
  }

  /**
   * Load an article by ID.
   * @param articleId - Article ID
   * @returns Help article or null if not found
   */
  async loadArticle(articleId: string): Promise<HelpArticle | null> {
    // Check cache first
    if (this.isCacheValid()) {
      const cached = this.registry.articles.get(articleId);
      if (cached) return cached;
    }

    // If custom loader is provided, use it
    if (this.config.loader) {
      const article = await this.config.loader(articleId);
      if (article) {
        this.registry.articles.set(articleId, article);
      }
      return article;
    }

    return null;
  }

  /**
   * Load and parse content from a raw string.
   * @param content - Raw content string
   * @param filename - Filename for parser detection
   * @param articleId - Article ID
   * @param categoryId - Optional category ID to associate with this article
   * @param order - Optional display order for this article
   * @param manifestTitle - Optional title from manifest (takes precedence)
   * @param manifestDescription - Optional description from manifest (takes precedence)
   * @returns Parsed help article or null
   */
  async parseContent(
    content: string,
    filename: string,
    articleId: string,
    categoryId?: string,
    order?: number,
    manifestTitle?: string,
    manifestDescription?: string,
  ): Promise<HelpArticle | null> {
    const extension = filename.split('.').pop() ?? '';
    const parser = this.getParser(extension);

    if (!parser) {
      console.warn(
        `No parser registered for extension: ${extension} (file: ${filename})`,
      );
      return null;
    }

    try {
      const result = await parser.parse(content, { filename });
      const article = this.createArticleFromResult(
        articleId,
        filename,
        content,
        result,
        categoryId,
        order,
        manifestTitle,
        manifestDescription,
      );

      // Cache the article
      this.registry.articles.set(articleId, article);
      this.updateIndex(article);

      return article;
    } catch (error) {
      console.error(`Failed to parse content: ${filename}`, error);
      return null;
    }
  }

  /**
   * Create a HelpArticle from a parse result.
   */
  private createArticleFromResult(
    id: string,
    filename: string,
    rawContent: string,
    result: ParseResult,
    categoryId?: string,
    order?: number,
    manifestTitle?: string,
    manifestDescription?: string,
  ): HelpArticle {
    // Title priority: 1. Manifest title, 2. Parser metadata custom title, 3. Markdown heading, 4. ID
    let title =
      manifestTitle ?? (result.metadata.custom?.title as string) ?? id;

    // For markdown content, try to extract title from first heading if no manifest or custom title
    if (
      (filename.endsWith('.md') || filename.endsWith('.mdx')) &&
      !manifestTitle &&
      !result.metadata.custom?.title
    ) {
      const titleMatch = rawContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }

    // Description priority: 1. Manifest description, 2. Parser metadata custom description, 3. First paragraph
    let description =
      manifestDescription ??
      (result.metadata.custom?.description as string | undefined);

    if (!description) {
      const descMatch = result.html.match(/<p[^>]*>([^<]+)<\/p>/);
      if (descMatch) {
        description = descMatch[1].substring(0, 160);
      }
    }

    return {
      id,
      title,
      description,
      content: rawContent,
      renderedContent: result.html,
      metadata: {
        ...result.metadata,
        slug: result.metadata.slug ?? this.generateSlug(filename),
        category: categoryId ?? result.metadata.category, // Use provided categoryId or fall back to metadata
        order: order ?? result.metadata.order, // Use provided order or fall back to metadata
      },
    };
  }

  /**
   * Generate a slug from filename.
   */
  private generateSlug(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Update the search index with an article.
   */
  private updateIndex(article: HelpArticle): void {
    const existingIndex = this.registry.index.findIndex(
      (i) => i.id === article.id,
    );
    const indexEntry: ContentIndex = {
      id: article.id,
      title: article.title,
      content: this.stripHtml(article.renderedContent ?? article.content),
      category: article.metadata.category,
      tags: article.metadata.tags,
    };

    if (existingIndex >= 0) {
      this.registry.index[existingIndex] = indexEntry;
    } else {
      this.registry.index.push(indexEntry);
    }
  }

  /**
   * Strip HTML tags from content for search indexing.
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if the cache is still valid.
   */
  private isCacheValid(): boolean {
    if (!this.cacheConfig.enabled) return false;
    const ttl = this.cacheConfig.ttl ?? 5 * 60 * 1000;
    return Date.now() - this.registry.lastUpdated < ttl;
  }

  /**
   * Get all cached articles.
   */
  getAllArticles(): HelpArticle[] {
    return Array.from(this.registry.articles.values());
  }

  /**
   * Get an article by ID.
   */
  getArticleById(id: string): HelpArticle | undefined {
    return this.registry.articles.get(id);
  }

  /**
   * Get the content index for search.
   */
  getContentIndex(): ContentIndex[] {
    return this.registry.index;
  }

  /**
   * Register a category.
   */
  registerCategory(category: HelpCategory): void {
    this.registry.categories.set(category.id, category);
  }

  /**
   * Get all categories.
   */
  getCategories(): HelpCategory[] {
    return Array.from(this.registry.categories.values());
  }

  /**
   * Get a category by ID.
   */
  getCategory(id: string): HelpCategory | undefined {
    return this.registry.categories.get(id);
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.registry.articles.clear();
    this.registry.categories.clear();
    this.registry.index = [];
    this.registry.lastUpdated = 0;
  }

  /**
   * Load articles from a content manifest.
   * @param manifest - Object mapping article IDs to their content
   * @param filenames - Optional object mapping article IDs to their filenames (for format detection)
   * @param categories - Optional object mapping article IDs to their category IDs
   * @param order - Optional object mapping article IDs to their display order
   * @param titles - Optional object mapping article IDs to their titles from manifest
   * @param descriptions - Optional object mapping article IDs to their descriptions from manifest
   */
  async loadFromManifest(
    manifest: Record<string, string>,
    filenames?: Record<string, string>,
    categories?: Record<string, string>,
    order?: Record<string, number>,
    titles?: Record<string, string>,
    descriptions?: Record<string, string>,
  ): Promise<void> {
    for (const [id, content] of Object.entries(manifest)) {
      // Use the actual filename if provided, otherwise default to .md
      const filename = filenames?.[id] ?? `${id}.md`;
      const categoryId = categories?.[id];
      const articleOrder = order?.[id];
      const articleTitle = titles?.[id];
      const articleDescription = descriptions?.[id];
      await this.parseContent(
        content,
        filename,
        id,
        categoryId,
        articleOrder,
        articleTitle,
        articleDescription,
      );
    }
    this.registry.lastUpdated = Date.now();
  }
}

/**
 * Create a static content loader with default configuration.
 */
export function createStaticLoader(
  config?: ContentConfig,
): StaticContentLoader {
  return new StaticContentLoader(config);
}
