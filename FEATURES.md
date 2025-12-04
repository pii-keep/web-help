# Feature Tracking

This document tracks all planned features for the @privify-pw/web-help component library.

## Phase 1A: Core Foundation (MVP - Dedicated Page Mode)

| Feature # | Title                                    | Status      | Description                                              |
| --------- | ---------------------------------------- | ----------- | -------------------------------------------------------- |
| #1        | TypeScript type system and interfaces    | ✅ Complete | Content interfaces, configuration types, parser plugins  |
| #2        | Markdown parser with frontmatter support | ✅ Complete | YAML metadata, extended syntax, plugin architecture      |
| #3        | Basic content loader (static files)      | ✅ Complete | Static file loader, caching, error handling              |
| #4        | Core context and state management        | ✅ Complete | HelpContext, content state, user preferences             |
| #5        | Dedicated page component (headless)      | ✅ Complete | HelpPage, HelpContent, HelpNavigation components         |

## Phase 1B: Navigation & Search

| Feature # | Title                        | Status      | Description                                        |
| --------- | ---------------------------- | ----------- | -------------------------------------------------- |
| #6        | Table of contents component  | ✅ Complete | Auto-generated from headings                       |
| #7        | Breadcrumb navigation        | ✅ Complete | Hierarchical navigation                            |
| #8        | Prev/Next pagination         | ✅ Complete | Navigation with metadata                           |
| #9        | Client-side search (fuse.js) | ✅ Complete | Autocomplete, recent searches, filtering           |
| #10       | Search adapter interface     | ✅ Complete | Custom search implementation support               |

## Phase 1C: Media & Rich Content

| Feature # | Title                              | Status      | Description                                   |
| --------- | ---------------------------------- | ----------- | --------------------------------------------- |
| #11       | Image component with lazy loading  | ✅ Complete | Lazy load, lightbox, CDN support              |
| #12       | Video embed component              | ✅ Complete | YouTube, Vimeo, custom video support          |
| #13       | Code syntax highlighting           | ✅ Complete | Lazy-loaded, copy, line numbers               |
| #14       | Callout/alert components           | ✅ Complete | Info, warning, tip, danger callouts           |
| #15       | Download/attachment support        | ✅ Complete | PDFs, templates, code samples                 |

## Phase 2A: User Engagement & Feedback

| Feature # | Title                         | Status      | Description                                    |
| --------- | ----------------------------- | ----------- | ---------------------------------------------- |
| #16       | Rating component              | ✅ Complete | onRate callback, customizable display          |
| #17       | Feedback widget               | ✅ Complete | "Was this helpful?" with onFeedback callback   |
| #18       | Comment display component     | ✅ Complete | Display and submit comments via callback       |
| #19       | Bookmarks functionality       | ✅ Complete | Toggle bookmarks with storage adapter          |
| #20       | Reading history tracking      | ✅ Complete | Track and display reading history              |

## Phase 2B: Additional Display Modes

| Feature # | Title                         | Status      | Description                                    |
| --------- | ----------------------------- | ----------- | ---------------------------------------------- |
| #21       | Modal display component       | ✅ Complete | Modal overlay with focus management            |
| #22       | Sidebar display component     | ✅ Complete | Left/right sidebar panel                       |
| #23       | Keyboard shortcuts system     | ✅ Complete | useHelpShortcuts hook, configurable bindings   |
| #24       | Context-sensitive help hooks  | ✅ Complete | Hooks for contextual help integration          |

## Phase 3A: Advanced Content Formats

| Feature # | Title                          | Status      | Description                                   |
| --------- | ------------------------------ | ----------- | --------------------------------------------- |
| #25       | MDX parser                     | ✅ Complete | MDX support with React components             |
| #26       | JSON content loader            | ✅ Complete | Load content from JSON files                  |
| #27       | CSV content loader             | ✅ Complete | Load content from CSV files                   |
| #28       | Content format detection       | ✅ Complete | Auto-detect based on file extension           |
| #29       | Multi-format documentation     | ✅ Complete | Support mixed format content                  |

## Phase 3B: Content Editor Utility

| Feature # | Title                          | Status      | Description                                   |
| --------- | ------------------------------ | ----------- | --------------------------------------------- |
| #30       | Content editor component       | ✅ Complete | Full editor with save/publish callbacks       |
| #31       | Markdown editor with preview   | ✅ Complete | WYSIWYG markdown editing                      |
| #32       | Metadata editor                | ✅ Complete | Form for editing article metadata             |
| #33       | Asset upload interface         | ✅ Complete | Upload and manage images/files                |
| #34       | Editor internationalization    | ✅ Complete | Multi-language support via i18n               |

## Phase 4: Advanced Features

| Feature # | Title                          | Status      | Description                                   |
| --------- | ------------------------------ | ----------- | --------------------------------------------- |
| #35       | Diagram support (Mermaid)      | ✅ Complete | Mermaid, PlantUML integration                 |
| #36       | Interactive sandbox            | ✅ Complete | CodeSandbox/StackBlitz embeds                 |
| #37       | Analytics hooks                | ✅ Complete | Track views, searches, interactions           |
| #38       | A11y audit and enhancements    | ✅ Complete | WCAG 2.1 AA compliance                        |
| #39       | PWA/offline support            | ✅ Complete | Service worker, content caching               |

## Phase 5: Developer Experience

| Feature # | Title                          | Status      | Description                                   |
| --------- | ------------------------------ | ----------- | --------------------------------------------- |
| #40       | CLI for scaffolding            | 🔲 Planned  | init, add-article, validate commands          |
| #41       | TypeScript config generator    | 🔲 Planned  | Generate help.config.ts                       |
| #42       | Content validation tools       | 🔲 Planned  | Validate content structure and links          |
| #43       | Migration utilities            | 🔲 Planned  | Migrate from other help systems               |
| #44       | Comprehensive documentation    | 🔲 Planned  | API reference, guides, examples               |

## Status Legend

- 🔲 Planned - Feature is documented and planned
- 🚧 In Progress - Feature is currently being implemented
- ✅ Complete - Feature is implemented and tested
- ⏸️ On Hold - Feature is paused
- ❌ Cancelled - Feature will not be implemented
