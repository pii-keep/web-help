/**
 * Content Format Detector for the Web Help Component Library
 * @module @piikeep-pw/web-help/loaders/contentFormatDetector
 */

import type { ContentFormat } from '../types/config';
import type { ContentParser } from '../types/parser';

/**
 * Detection result with confidence score.
 */
export interface FormatDetectionResult {
  /** Detected format */
  format: ContentFormat;
  /** Confidence score (0-1) */
  confidence: number;
  /** Parser name if a matching parser is found */
  parserName?: string;
}

/**
 * Content format detector for auto-detecting content types.
 */
export class ContentFormatDetector {
  private parsers: Map<string, ContentParser>;

  constructor(parsers?: ContentParser[]) {
    this.parsers = new Map();
    if (parsers) {
      parsers.forEach((parser) => this.registerParser(parser));
    }
  }

  /**
   * Register a content parser.
   */
  registerParser(parser: ContentParser): void {
    for (const ext of parser.extensions) {
      this.parsers.set(ext.toLowerCase(), parser);
    }
  }

  /**
   * Detect content format from filename.
   */
  detectFromFilename(filename: string): FormatDetectionResult | null {
    const ext = this.extractExtension(filename);
    if (!ext) return null;

    const format = this.extensionToFormat(ext);
    if (!format) return null;

    const parser = this.parsers.get(ext);

    return {
      format,
      confidence: 1.0,
      parserName: parser?.name,
    };
  }

  /**
   * Detect content format from content.
   */
  detectFromContent(
    content: string,
    filename?: string,
  ): FormatDetectionResult | null {
    // First try filename-based detection
    if (filename) {
      const filenameResult = this.detectFromFilename(filename);
      if (filenameResult) return filenameResult;
    }

    // Try content-based detection
    const results = this.detectAllFormats(content);
    if (results.length === 0) return null;

    // Return the format with highest confidence
    return results.sort((a, b) => b.confidence - a.confidence)[0];
  }

  /**
   * Detect all possible formats with confidence scores.
   */
  detectAllFormats(content: string): FormatDetectionResult[] {
    const results: FormatDetectionResult[] = [];
    const trimmed = content.trim();

    // Check for JSON
    const jsonConfidence = this.detectJson(trimmed);
    if (jsonConfidence > 0) {
      results.push({
        format: 'json',
        confidence: jsonConfidence,
        parserName: this.parsers.get('json')?.name,
      });
    }

    // Check for CSV
    const csvConfidence = this.detectCsv(trimmed);
    if (csvConfidence > 0) {
      results.push({
        format: 'csv',
        confidence: csvConfidence,
        parserName: this.parsers.get('csv')?.name,
      });
    }

    // Check for MDX (before markdown, as MDX contains markdown)
    const mdxConfidence = this.detectMdx(trimmed);
    if (mdxConfidence > 0) {
      results.push({
        format: 'mdx',
        confidence: mdxConfidence,
        parserName: this.parsers.get('mdx')?.name,
      });
    }

    // Check for Markdown
    const mdConfidence = this.detectMarkdown(trimmed);
    if (mdConfidence > 0) {
      results.push({
        format: 'md',
        confidence: mdConfidence,
        parserName: this.parsers.get('md')?.name,
      });
    }

    // Check for HTML
    const htmlConfidence = this.detectHtml(trimmed);
    if (htmlConfidence > 0) {
      results.push({
        format: 'html',
        confidence: htmlConfidence,
        parserName: this.parsers.get('html')?.name,
      });
    }

    return results;
  }

  /**
   * Get a parser for the detected format.
   */
  getParserForContent(
    content: string,
    filename?: string,
  ): ContentParser | null {
    const result = this.detectFromContent(content, filename);
    if (!result) return null;

    // Try to find parser by format
    const parser = this.parsers.get(result.format);
    if (parser) return parser;

    // Try extensions based on format
    const extensions = this.formatToExtensions(result.format);
    for (const ext of extensions) {
      const p = this.parsers.get(ext);
      if (p) return p;
    }

    return null;
  }

  /**
   * Detect JSON content.
   */
  private detectJson(content: string): number {
    if (content.startsWith('{') && content.endsWith('}')) {
      try {
        JSON.parse(content);
        return 1.0;
      } catch {
        return 0.3; // Looks like JSON but invalid
      }
    }
    if (content.startsWith('[') && content.endsWith(']')) {
      try {
        JSON.parse(content);
        return 0.9; // Valid JSON array, slightly less likely for help content
      } catch {
        return 0.2;
      }
    }
    return 0;
  }

  /**
   * Detect CSV content.
   */
  private detectCsv(content: string): number {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length < 2) return 0;

    // Count consistent delimiters
    const commaConsistency = this.checkDelimiterConsistency(lines, ',');
    const tabConsistency = this.checkDelimiterConsistency(lines, '\t');
    const semicolonConsistency = this.checkDelimiterConsistency(lines, ';');

    const maxConsistency = Math.max(
      commaConsistency,
      tabConsistency,
      semicolonConsistency,
    );

    if (maxConsistency >= 0.9) return 0.9;
    if (maxConsistency >= 0.7) return 0.7;
    if (maxConsistency >= 0.5) return 0.4;
    return 0;
  }

  /**
   * Check delimiter consistency across lines.
   */
  private checkDelimiterConsistency(
    lines: string[],
    delimiter: string,
  ): number {
    if (lines.length < 2) return 0;

    const counts = lines.map((line) => {
      // Simple count - doesn't handle quoted fields
      return (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    });

    // Check if first line (header) has same count as other lines
    const headerCount = counts[0];
    if (headerCount === 0) return 0;

    const matchingLines = counts
      .slice(1)
      .filter((count) => count === headerCount).length;
    return matchingLines / (counts.length - 1);
  }

  /**
   * Detect MDX content.
   */
  private detectMdx(content: string): number {
    // Look for JSX-like patterns
    const hasJsxImport = /^import\s+.*from\s+['"]/.test(content);
    const hasJsxExport =
      /^export\s+(default\s+)?(?:function|const|let|var|class)/.test(content);
    const hasJsxComponent = /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(content);
    const hasJsxExpression = /\{[^}]+\}/.test(content);

    let confidence = 0;

    if (hasJsxImport) confidence += 0.4;
    if (hasJsxExport) confidence += 0.3;
    if (hasJsxComponent) confidence += 0.3;
    if (hasJsxExpression && hasJsxComponent) confidence += 0.2;

    // Also needs some markdown indicators
    const hasMarkdown = this.detectMarkdown(content) > 0;
    if (confidence > 0 && hasMarkdown) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect Markdown content.
   */
  private detectMarkdown(content: string): number {
    let confidence = 0;

    // Frontmatter
    if (content.startsWith('---')) {
      confidence += 0.3;
    }

    // Headings
    if (/^#{1,6}\s+/m.test(content)) {
      confidence += 0.2;
    }

    // Links
    if (/\[.+\]\(.+\)/.test(content)) {
      confidence += 0.15;
    }

    // Bold/italic
    if (
      /(\*\*|__).+(\*\*|__)/.test(content) ||
      /(\*|_).+(\*|_)/.test(content)
    ) {
      confidence += 0.1;
    }

    // Code blocks
    if (/```[\s\S]*?```/.test(content)) {
      confidence += 0.15;
    }

    // Lists
    if (/^[\s]*[-*+]\s+/m.test(content) || /^\d+\.\s+/m.test(content)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect HTML content.
   */
  private detectHtml(content: string): number {
    let confidence = 0;

    // DOCTYPE
    if (/<!DOCTYPE\s+html/i.test(content)) {
      return 1.0;
    }

    // HTML tag
    if (/<html[\s>]/i.test(content)) {
      confidence += 0.4;
    }

    // Common HTML tags
    const htmlTags = [
      '<head>',
      '<body>',
      '<div>',
      '<p>',
      '<span>',
      '<article>',
      '<section>',
    ];
    const tagMatches = htmlTags.filter((tag) =>
      content.toLowerCase().includes(tag),
    ).length;
    confidence += Math.min(tagMatches * 0.15, 0.6);

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract file extension from filename.
   */
  private extractExtension(filename: string): string | null {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Convert extension to content format.
   */
  private extensionToFormat(ext: string): ContentFormat | null {
    const mapping: Record<string, ContentFormat> = {
      md: 'md',
      markdown: 'md',
      mdx: 'mdx',
      json: 'json',
      csv: 'csv',
      tsv: 'csv',
      html: 'html',
      htm: 'html',
    };
    return mapping[ext] ?? null;
  }

  /**
   * Get extensions for a content format.
   */
  private formatToExtensions(format: ContentFormat): string[] {
    const mapping: Record<ContentFormat, string[]> = {
      md: ['md', 'markdown'],
      mdx: ['mdx'],
      json: ['json'],
      csv: ['csv', 'tsv'],
      html: ['html', 'htm'],
    };
    return mapping[format] ?? [];
  }
}

/**
 * Create a content format detector with optional parsers.
 */
export function createFormatDetector(
  parsers?: ContentParser[],
): ContentFormatDetector {
  return new ContentFormatDetector(parsers);
}
