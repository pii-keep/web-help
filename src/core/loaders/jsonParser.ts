/**
 * JSON Content Parser for the Web Help Component Library
 * @module @piikeep-pw/web-help/loaders/jsonParser
 */

import type {
  ContentParser,
  ParseResult,
  ParserOptions,
} from '../types/parser';
import type { HelpArticleMetadata, TOCEntry } from '../types/content';

/**
 * Expected structure for JSON help content.
 */
export interface JsonHelpContent {
  /** Article title */
  title?: string;
  /** Article description */
  description?: string;
  /** Main content - can be HTML string or array of content blocks */
  content: string | JsonContentBlock[];
  /** Article metadata */
  metadata?: Partial<HelpArticleMetadata>;
  /** Table of contents entries */
  toc?: TOCEntry[];
}

/**
 * Content block for structured JSON content.
 */
export interface JsonContentBlock {
  /** Block type */
  type:
    | 'heading'
    | 'paragraph'
    | 'code'
    | 'image'
    | 'list'
    | 'blockquote'
    | 'callout'
    | 'html';
  /** Block content */
  content: string;
  /** Heading level (for heading type) */
  level?: number;
  /** Language (for code type) */
  language?: string;
  /** Image URL (for image type) */
  src?: string;
  /** Alt text (for image type) */
  alt?: string;
  /** List items (for list type) */
  items?: string[];
  /** Whether list is ordered (for list type) */
  ordered?: boolean;
  /** Callout type (for callout type) */
  calloutType?: 'info' | 'warning' | 'tip' | 'danger';
}

/**
 * Create a JSON content parser.
 * @returns Content parser for JSON files
 */
export function createJsonParser(): ContentParser {
  return {
    name: 'json',
    extensions: ['json'],

    canParse(content: string, filename?: string): boolean {
      if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext === 'json';
      }
      // Try to detect JSON content
      const trimmed = content.trim();
      return trimmed.startsWith('{') || trimmed.startsWith('[');
    },

    async parse(
      content: string,
      options?: ParserOptions,
    ): Promise<ParseResult> {
      let jsonContent: JsonHelpContent;

      try {
        jsonContent = JSON.parse(content) as JsonHelpContent;
      } catch {
        throw new Error(
          `Invalid JSON content${
            options?.filename ? ` in ${options.filename}` : ''
          }`,
        );
      }

      // Validate required fields
      if (!jsonContent.content) {
        throw new Error('JSON content must have a "content" field');
      }

      // Build HTML from content
      const html = buildHtmlFromContent(jsonContent.content);

      // Extract or build TOC
      const toc = jsonContent.toc ?? extractTocFromContent(jsonContent.content);

      // Build metadata
      const metadata: HelpArticleMetadata = {
        ...jsonContent.metadata,
        slug: jsonContent.metadata?.slug ?? generateSlug(options?.filename),
        published: jsonContent.metadata?.published ?? true,
      };

      // If title is provided at top level, use it for custom metadata
      if (jsonContent.title && !metadata.custom?.title) {
        metadata.custom = { ...metadata.custom, title: jsonContent.title };
      }
      if (jsonContent.description && !metadata.custom?.description) {
        metadata.custom = {
          ...metadata.custom,
          description: jsonContent.description,
        };
      }

      return {
        html,
        metadata,
        toc,
      };
    },
  };
}

/**
 * Build HTML from JSON content.
 */
function buildHtmlFromContent(content: string | JsonContentBlock[]): string {
  if (typeof content === 'string') {
    // If content is already HTML string, return it wrapped
    return `<div class="help-json-content">${content}</div>`;
  }

  // Build HTML from content blocks
  const htmlParts = content.map((block) => renderContentBlock(block));
  return `<div class="help-json-content">${htmlParts.join('\n')}</div>`;
}

/**
 * Render a single content block to HTML.
 */
function renderContentBlock(block: JsonContentBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2;
      const id = generateHeadingId(block.content);
      return `<h${level} id="${id}" class="help-heading help-heading-${level}">${escapeHtml(
        block.content,
      )}</h${level}>`;
    }

    case 'paragraph':
      return `<p class="help-paragraph">${escapeHtml(block.content)}</p>`;

    case 'code': {
      const langClass = block.language
        ? ` language-${escapeHtml(block.language)}`
        : '';
      return `<pre class="help-code-block${langClass}"><code class="help-code${langClass}">${escapeHtml(
        block.content,
      )}</code></pre>`;
    }

    case 'image': {
      const src = block.src ?? block.content;
      const alt = block.alt ?? '';
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(
        alt,
      )}" class="help-image" loading="lazy" />`;
    }

    case 'list': {
      const items = block.items ?? [block.content];
      const tag = block.ordered ? 'ol' : 'ul';
      const itemsHtml = items
        .map((item) => `<li class="help-list-item">${escapeHtml(item)}</li>`)
        .join('');
      return `<${tag} class="help-list help-list-${
        block.ordered ? 'ordered' : 'unordered'
      }">${itemsHtml}</${tag}>`;
    }

    case 'blockquote':
      return `<blockquote class="help-blockquote"><p>${escapeHtml(
        block.content,
      )}</p></blockquote>`;

    case 'callout': {
      const type = block.calloutType ?? 'info';
      return `<div class="help-callout help-callout-${type}" data-type="${type}"><p>${escapeHtml(
        block.content,
      )}</p></div>`;
    }

    case 'html':
      // Raw HTML - return as-is (developer responsibility to ensure safety)
      return block.content;

    default:
      return `<p class="help-paragraph">${escapeHtml(block.content)}</p>`;
  }
}

/**
 * Extract TOC from content blocks.
 */
function extractTocFromContent(
  content: string | JsonContentBlock[],
): TOCEntry[] {
  if (typeof content === 'string') {
    // Try to extract headings from HTML string
    const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
    const entries: TOCEntry[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      entries.push({
        level: parseInt(match[1], 10),
        id: match[2],
        text: match[3],
      });
    }

    return buildTocTree(entries);
  }

  // Extract from content blocks
  const entries: TOCEntry[] = content
    .filter((block) => block.type === 'heading')
    .map((block) => ({
      level: block.level ?? 2,
      id: generateHeadingId(block.content),
      text: block.content,
    }));

  return buildTocTree(entries);
}

/**
 * Build a nested TOC tree from flat entries.
 */
function buildTocTree(entries: TOCEntry[]): TOCEntry[] {
  if (entries.length === 0) return [];

  const result: TOCEntry[] = [];
  const stack: { entry: TOCEntry; level: number }[] = [];

  for (const entry of entries) {
    const tocEntry: TOCEntry = { ...entry, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(tocEntry);
    } else {
      const parent = stack[stack.length - 1].entry;
      if (!parent.children) parent.children = [];
      parent.children.push(tocEntry);
    }

    stack.push({ entry: tocEntry, level: entry.level });
  }

  // Clean up empty children arrays
  const cleanChildren = (tocEntries: TOCEntry[]): TOCEntry[] => {
    return tocEntries.map((e) => ({
      ...e,
      children:
        e.children && e.children.length > 0
          ? cleanChildren(e.children)
          : undefined,
    }));
  };

  return cleanChildren(result);
}

/**
 * Generate a heading ID from text.
 */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a slug from filename.
 */
function generateSlug(filename?: string): string | undefined {
  if (!filename) return undefined;
  return filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}
