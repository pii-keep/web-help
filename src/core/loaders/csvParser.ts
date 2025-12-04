/**
 * CSV Content Parser for the Web Help Component Library
 * @module @piikeep-pw/web-help/loaders/csvParser
 */

import type {
  ContentParser,
  ParseResult,
  ParserOptions,
} from '../types/parser';
import type { HelpArticleMetadata } from '../types/content';

/**
 * Options for CSV parsing.
 */
export interface CsvParserOptions extends ParserOptions {
  /** Column delimiter (default: ',') */
  delimiter?: string;
  /** Whether first row is header (default: true) */
  hasHeader?: boolean;
  /** Quote character (default: '"') */
  quote?: string;
  /** Column to use as title */
  titleColumn?: string;
  /** Column to use as content */
  contentColumn?: string;
  /** Columns to include as metadata */
  metadataColumns?: string[];
  /** Render as table (default: true) */
  renderAsTable?: boolean;
}

/**
 * Create a CSV content parser.
 * @returns Content parser for CSV files
 */
export function createCsvParser(): ContentParser {
  return {
    name: 'csv',
    extensions: ['csv', 'tsv'],

    canParse(content: string, filename?: string): boolean {
      if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext === 'csv' || ext === 'tsv';
      }
      // Try to detect CSV content - look for comma-separated values pattern
      const lines = content.trim().split('\n');
      if (lines.length < 2) return false;
      const firstLineCommas = (lines[0].match(/,/g) || []).length;
      const secondLineCommas = (lines[1].match(/,/g) || []).length;
      return firstLineCommas > 0 && firstLineCommas === secondLineCommas;
    },

    async parse(
      content: string,
      options?: ParserOptions,
    ): Promise<ParseResult> {
      const csvOptions = options as CsvParserOptions | undefined;
      const delimiter =
        csvOptions?.delimiter ??
        (options?.filename?.endsWith('.tsv') ? '\t' : ',');
      const hasHeader = csvOptions?.hasHeader ?? true;
      const quote = csvOptions?.quote ?? '"';
      const renderAsTable = csvOptions?.renderAsTable ?? true;

      // Parse CSV content
      const rows = parseCSV(content, delimiter, quote);

      if (rows.length === 0) {
        return {
          html: '<div class="help-csv-content help-csv-empty">No data</div>',
          metadata: {},
        };
      }

      // Extract headers if present
      const headers = hasHeader
        ? rows[0]
        : rows[0].map((_, i) => `Column ${i + 1}`);
      const dataRows = hasHeader ? rows.slice(1) : rows;

      // Build HTML
      let html: string;
      if (renderAsTable) {
        html = buildTableHtml(headers, dataRows);
      } else {
        html = buildListHtml(headers, dataRows, csvOptions);
      }

      // Build metadata
      const metadata: HelpArticleMetadata = {
        slug: generateSlug(options?.filename),
        published: true,
        custom: {
          rowCount: dataRows.length,
          columnCount: headers.length,
          columns: headers,
        },
      };

      return {
        html,
        metadata,
      };
    },
  };
}

/**
 * Parse CSV content into rows.
 */
function parseCSV(
  content: string,
  delimiter: string,
  quote: string,
): string[][] {
  const rows: string[][] = [];
  const lines = content.split('\n');

  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === quote) {
          if (nextChar === quote) {
            // Escaped quote
            currentCell += quote;
            i++;
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === quote) {
          inQuotes = true;
        } else if (char === delimiter) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    if (!inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      // Line continues (quoted field with newline)
      currentCell += '\n';
    }
  }

  // Handle last row if not ended with newline
  if (currentRow.length > 0 || currentCell !== '') {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Build an HTML table from CSV data.
 */
function buildTableHtml(headers: string[], rows: string[][]): string {
  const headerHtml = headers
    .map((h) => `<th class="help-table-header">${escapeHtml(h)}</th>`)
    .join('');

  const bodyHtml = rows
    .map((row) => {
      const cells = row
        .map((cell, i) => {
          // Pad row if necessary
          const content = i < row.length ? cell : '';
          return `<td class="help-table-cell">${escapeHtml(content)}</td>`;
        })
        .join('');
      return `<tr class="help-table-row">${cells}</tr>`;
    })
    .join('');

  return `<div class="help-csv-content">
  <table class="help-table help-csv-table">
    <thead class="help-table-head">
      <tr>${headerHtml}</tr>
    </thead>
    <tbody class="help-table-body">
      ${bodyHtml}
    </tbody>
  </table>
</div>`;
}

/**
 * Build an HTML list from CSV data.
 */
function buildListHtml(
  headers: string[],
  rows: string[][],
  options?: CsvParserOptions,
): string {
  const titleColumn = options?.titleColumn ?? headers[0];
  const contentColumn = options?.contentColumn ?? headers[1];
  const titleIndex = headers.indexOf(titleColumn);
  const contentIndex = headers.indexOf(contentColumn);

  const itemsHtml = rows
    .map((row) => {
      const title =
        titleIndex >= 0 && titleIndex < row.length
          ? row[titleIndex]
          : row[0] ?? '';
      const content =
        contentIndex >= 0 && contentIndex < row.length
          ? row[contentIndex]
          : row[1] ?? '';

      // Build metadata from other columns
      const metaHtml = headers
        .map((header, i) => {
          if (i === titleIndex || i === contentIndex) return '';
          const value = i < row.length ? row[i] : '';
          if (!value) return '';
          return `<span class="help-csv-meta-item"><strong>${escapeHtml(
            header,
          )}:</strong> ${escapeHtml(value)}</span>`;
        })
        .filter((html) => html !== '')
        .join(' ');

      return `<div class="help-csv-item">
  <h3 class="help-csv-item-title">${escapeHtml(title)}</h3>
  <p class="help-csv-item-content">${escapeHtml(content)}</p>
  ${metaHtml ? `<div class="help-csv-item-meta">${metaHtml}</div>` : ''}
</div>`;
    })
    .join('\n');

  return `<div class="help-csv-content help-csv-list">${itemsHtml}</div>`;
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
