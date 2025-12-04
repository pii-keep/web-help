/**
 * MDX Content Parser for the Web Help Component Library
 * @module @piikeep-pw/web-help/loaders/mdxParser
 *
 * This parser handles MDX content by extracting frontmatter, processing
 * markdown content, and identifying JSX component usage. Full MDX runtime
 * evaluation requires the developer to provide component mappings.
 */

import type {
  ContentParser,
  ParseResult,
  ParserOptions,
  AssetReference,
} from '../types/parser';
import type { HelpArticleMetadata, TOCEntry } from '../types/content';
import matter from 'gray-matter';
import { Marked, type Tokens } from 'marked';

/**
 * Options for MDX parsing.
 */
export interface MdxParserOptions extends ParserOptions {
  /** Component mapping for JSX components */
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
  /** Whether to render components as placeholders (default: true) */
  renderPlaceholders?: boolean;
  /** Custom component placeholder renderer */
  placeholderRenderer?: (
    componentName: string,
    props: Record<string, unknown>,
  ) => string;
}

/**
 * Extracted JSX component from MDX content.
 */
export interface ExtractedComponent {
  /** Component name */
  name: string;
  /** Props passed to the component */
  props: Record<string, unknown>;
  /** Original JSX string */
  original: string;
  /** Position in content */
  position: {
    start: number;
    end: number;
  };
}

/**
 * Create an MDX content parser.
 * Note: This is a static parser that extracts components and converts
 * markdown. For full MDX runtime support, use with a component provider.
 * @returns Content parser for MDX files
 */
export function createMdxParser(): ContentParser {
  return {
    name: 'mdx',
    extensions: ['mdx'],

    canParse(content: string, filename?: string): boolean {
      if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext === 'mdx';
      }
      // Check for MDX indicators: JSX components or imports/exports
      const hasJsxComponent = /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(content);
      const hasImport = /^import\s+/m.test(content);
      const hasExport = /^export\s+/m.test(content);
      return hasJsxComponent || hasImport || hasExport;
    },

    async parse(
      content: string,
      options?: ParserOptions,
    ): Promise<ParseResult> {
      const mdxOptions = options as MdxParserOptions | undefined;
      const renderPlaceholders = mdxOptions?.renderPlaceholders ?? true;

      // Parse frontmatter
      const { data: frontmatter, content: mdxContent } = matter(content);

      // Extract imports and exports
      const {
        cleanContent,
        imports,
        exports: mdxExports,
      } = extractImportsExports(mdxContent);

      // Extract JSX components
      const { processedContent, components } = extractJsxComponents(
        cleanContent,
        renderPlaceholders,
        mdxOptions?.placeholderRenderer,
      );

      // Parse remaining markdown content
      const assets: AssetReference[] = [];
      const tocEntries: TOCEntry[] = [];
      const warnings: string[] = [];

      const marked = new Marked({
        gfm: true,
        breaks: false,
      });

      // Custom renderer
      marked.use({
        renderer: {
          heading({ tokens, depth }: Tokens.Heading): string {
            const text = this.parser.parseInline(tokens);
            const id = generateHeadingId(text);

            tocEntries.push({
              id,
              text,
              level: depth,
            });

            return `<h${depth} id="${id}" class="help-heading help-heading-${depth}">${text}</h${depth}>`;
          },

          image({ href, title, text }: Tokens.Image): string {
            assets.push({
              type: 'image',
              originalUrl: href,
              alt: text,
              title: title ?? undefined,
            });

            const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
            return `<img src="${escapeHtml(href)}" alt="${escapeHtml(
              text,
            )}"${titleAttr} class="help-image" loading="lazy" />`;
          },

          link({ href, title, tokens }: Tokens.Link): string {
            const text = this.parser.parseInline(tokens);
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
            const isExternal =
              href.startsWith('http://') || href.startsWith('https://');
            const externalAttrs = isExternal
              ? ' target="_blank" rel="noopener noreferrer"'
              : '';

            return `<a href="${escapeHtml(
              href,
            )}"${titleAttr}${externalAttrs} class="help-link${
              isExternal ? ' help-link-external' : ''
            }">${text}</a>`;
          },

          code({ text, lang }: Tokens.Code): string {
            const languageClass = lang ? ` language-${escapeHtml(lang)}` : '';
            return `<pre class="help-code-block${languageClass}"><code class="help-code${languageClass}">${escapeHtml(
              text,
            )}</code></pre>`;
          },

          codespan({ text }: Tokens.Codespan): string {
            return `<code class="help-inline-code">${escapeHtml(text)}</code>`;
          },

          blockquote({ tokens }: Tokens.Blockquote): string {
            const body = this.parser.parse(tokens);
            return `<blockquote class="help-blockquote">${body}</blockquote>`;
          },

          table({ header, rows }: Tokens.Table): string {
            const headerHtml = header
              .map(
                (cell) =>
                  `<th class="help-table-header">${this.parser.parseInline(
                    cell.tokens,
                  )}</th>`,
              )
              .join('');

            const bodyHtml = rows
              .map((row) => {
                const cells = row
                  .map(
                    (cell) =>
                      `<td class="help-table-cell">${this.parser.parseInline(
                        cell.tokens,
                      )}</td>`,
                  )
                  .join('');
                return `<tr class="help-table-row">${cells}</tr>`;
              })
              .join('');

            return `<table class="help-table"><thead class="help-table-head"><tr>${headerHtml}</tr></thead><tbody class="help-table-body">${bodyHtml}</tbody></table>`;
          },

          paragraph({ tokens }: Tokens.Paragraph): string {
            return `<p class="help-paragraph">${this.parser.parseInline(
              tokens,
            )}</p>`;
          },
        },
      });

      // Parse the processed content
      const html = await marked.parse(processedContent);

      // Build metadata
      const metadata = extractMetadata(frontmatter, options);

      // Add MDX-specific metadata
      if (
        imports.length > 0 ||
        mdxExports.length > 0 ||
        components.length > 0
      ) {
        metadata.custom = {
          ...metadata.custom,
          mdx: {
            imports,
            exports: mdxExports,
            components: components.map((c) => ({
              name: c.name,
              props: c.props,
            })),
          },
        };
      }

      // Build TOC
      const toc = buildTOCTree(tocEntries);

      return {
        html,
        metadata,
        toc,
        assets,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    },
  };
}

/**
 * Extract imports and exports from MDX content.
 */
function extractImportsExports(content: string): {
  cleanContent: string;
  imports: string[];
  exports: string[];
} {
  const lines = content.split('\n');
  const imports: string[] = [];
  const exports: string[] = [];
  const cleanLines: string[] = [];

  let inMultilineImport = false;
  let currentImport = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle multi-line imports
    if (inMultilineImport) {
      currentImport += '\n' + line;
      if (
        trimmed.includes(';') ||
        (trimmed.includes('from') && trimmed.endsWith("'"))
      ) {
        imports.push(currentImport.trim());
        inMultilineImport = false;
        currentImport = '';
      }
      continue;
    }

    // Single-line import
    if (trimmed.startsWith('import ')) {
      if (
        trimmed.includes('from') &&
        (trimmed.endsWith("'") ||
          trimmed.endsWith('"') ||
          trimmed.endsWith(';'))
      ) {
        imports.push(trimmed);
      } else {
        inMultilineImport = true;
        currentImport = line;
      }
      continue;
    }

    // Export statements (except export default for components)
    if (
      trimmed.startsWith('export ') &&
      !trimmed.includes('export default function')
    ) {
      exports.push(trimmed);
      continue;
    }

    cleanLines.push(line);
  }

  return {
    cleanContent: cleanLines.join('\n'),
    imports,
    exports,
  };
}

/**
 * Extract JSX components from content.
 */
function extractJsxComponents(
  content: string,
  renderPlaceholders: boolean,
  placeholderRenderer?: (
    componentName: string,
    props: Record<string, unknown>,
  ) => string,
): {
  processedContent: string;
  components: ExtractedComponent[];
} {
  const components: ExtractedComponent[] = [];

  // Match JSX components (starting with uppercase letter)
  // This is a simplified regex - doesn't handle all edge cases
  const jsxRegex =
    /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*(\/?>)(?:([\s\S]*?)<\/\1>)?/g;

  let processedContent = content;
  let match;
  let offset = 0;

  // Reset regex
  jsxRegex.lastIndex = 0;

  // Clone content for matching to avoid issues with offset changes
  const originalContent = content;

  while ((match = jsxRegex.exec(originalContent)) !== null) {
    const componentName = match[1];
    const propsString = match[2];
    const selfClosing = match[3] === '/>';
    const children = match[4] || '';
    const original = match[0];

    // Parse props
    const props = parseJsxProps(propsString);
    if (!selfClosing && children) {
      props.children = children.trim();
    }

    components.push({
      name: componentName,
      props,
      original,
      position: {
        start: match.index,
        end: match.index + original.length,
      },
    });

    // Replace with placeholder if enabled
    if (renderPlaceholders) {
      const placeholder = placeholderRenderer
        ? placeholderRenderer(componentName, props)
        : createDefaultPlaceholder(componentName, props);

      const adjustedStart = match.index + offset;
      const adjustedEnd = adjustedStart + original.length;

      processedContent =
        processedContent.substring(0, adjustedStart) +
        placeholder +
        processedContent.substring(adjustedEnd);

      offset += placeholder.length - original.length;
    }
  }

  return { processedContent, components };
}

/**
 * Parse JSX props string into an object.
 */
function parseJsxProps(propsString: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  if (!propsString.trim()) return props;

  // Match prop patterns: name="value", name='value', name={value}, name
  const propRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;
  let match;

  while ((match = propRegex.exec(propsString)) !== null) {
    const name = match[1];
    const doubleQuoteValue = match[2];
    const singleQuoteValue = match[3];
    const expressionValue = match[4];

    if (doubleQuoteValue !== undefined) {
      props[name] = doubleQuoteValue;
    } else if (singleQuoteValue !== undefined) {
      props[name] = singleQuoteValue;
    } else if (expressionValue !== undefined) {
      // Try to parse as JSON for simple values
      try {
        props[name] = JSON.parse(expressionValue);
      } catch {
        props[name] = expressionValue; // Keep as string expression
      }
    } else {
      props[name] = true; // Boolean prop
    }
  }

  return props;
}

/**
 * Create a default placeholder for a component.
 */
function createDefaultPlaceholder(
  componentName: string,
  props: Record<string, unknown>,
): string {
  const propsDisplay = Object.entries(props)
    .filter(([key]) => key !== 'children')
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ');

  const hasChildren = 'children' in props;
  const childrenNote = hasChildren ? ' (with children)' : '';

  return `<div class="help-mdx-placeholder" data-component="${escapeHtml(
    componentName,
  )}" data-props='${escapeHtml(JSON.stringify(props))}'>
  <span class="help-mdx-placeholder-label">&lt;${escapeHtml(componentName)}${
    propsDisplay ? ' ' + escapeHtml(propsDisplay) : ''
  }${childrenNote} /&gt;</span>
</div>`;
}

/**
 * Extract metadata from frontmatter.
 */
function extractMetadata(
  frontmatter: Record<string, unknown>,
  options?: ParserOptions,
): HelpArticleMetadata {
  return {
    version: asString(frontmatter.version),
    order: asNumber(frontmatter.order),
    prevArticle:
      asString(frontmatter.prevArticle) || asString(frontmatter.prev),
    nextArticle:
      asString(frontmatter.nextArticle) || asString(frontmatter.next),
    createdAt:
      asString(frontmatter.createdAt) ||
      asString(frontmatter.created) ||
      asString(frontmatter.date),
    updatedAt: asString(frontmatter.updatedAt) || asString(frontmatter.updated),
    category: asString(frontmatter.category),
    tags: asStringArray(frontmatter.tags),
    author: asString(frontmatter.author),
    relatedArticles:
      asStringArray(frontmatter.relatedArticles) ||
      asStringArray(frontmatter.related),
    slug:
      asString(frontmatter.slug) ||
      (options?.filename ? generateSlug(options.filename) : undefined),
    published: asBoolean(frontmatter.published) ?? true,
    custom: extractCustomMetadata(frontmatter),
  };
}

/**
 * Extract custom metadata fields.
 */
function extractCustomMetadata(
  frontmatter: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const standardKeys = new Set([
    'version',
    'order',
    'prevArticle',
    'prev',
    'nextArticle',
    'next',
    'createdAt',
    'created',
    'date',
    'updatedAt',
    'updated',
    'category',
    'tags',
    'author',
    'relatedArticles',
    'related',
    'slug',
    'published',
    'title',
    'description',
  ]);

  const custom: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!standardKeys.has(key)) {
      custom[key] = value;
    }
  }

  return Object.keys(custom).length > 0 ? custom : undefined;
}

/**
 * Build a nested TOC tree from flat entries.
 */
function buildTOCTree(entries: TOCEntry[]): TOCEntry[] {
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
  let result = text;
  let previousResult: string;
  do {
    previousResult = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== previousResult);

  return result
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a slug from filename.
 */
function generateSlug(filename: string): string {
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

// Type guard helpers
function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string') as string[];
  }
  return undefined;
}
