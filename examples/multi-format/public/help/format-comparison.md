---
title: Format Comparison
category: formats
tags: [comparison, formats]
order: 3
---

# Format Comparison

Compare the different content formats supported by @piikeep/web-help.

## Markdown (.md)

**Best for:**

- Human-written documentation
- Rich text with formatting
- Code examples
- Traditional documentation

**Pros:**

- Easy to write and read
- Great for version control
- Wide tool support
- Clean syntax

**Cons:**

- Limited structured data
- Requires parsing

## JSON (.json)

**Best for:**

- Programmatically generated content
- API documentation
- Structured data
- Content from other systems

**Pros:**

- Strict validation
- Easy to parse
- Native JavaScript support
- Structured metadata

**Cons:**

- Verbose for simple content
- Not as human-friendly

## CSV (.csv)

**Best for:**

- Bulk content import
- Spreadsheet-based editing
- Simple tabular data
- Quick migrations

**Pros:**

- Universal format
- Excel/Sheets compatibility
- Simple structure
- Easy bulk editing

**Cons:**

- Limited formatting
- HTML in content field
- Less readable

## Choosing a Format

Consider these factors:

1. **Content Source**: Where is your content coming from?
2. **Editing Workflow**: Who will edit the content?
3. **Complexity**: How complex is your content?
4. **Volume**: How much content do you have?

## Mixing Formats

You can use multiple formats in the same project! The library will:

- Auto-detect the format
- Parse each file appropriately
- Present a unified help system
