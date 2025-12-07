# Web-Help Package Enhancement Plan

**Date:** 2025-12-05  
**Status:** Proposal  
**Current Package:** @piikeep/web-help v0.1.2  
**Target Version:** v1.0.0

## Executive Summary

This document outlines features currently implemented in the PIIKeep help system that can be extracted into the `@piikeep/web-help` package to transform it from a basic component library into a comprehensive, production-ready documentation platform.

**Current State:**

- Basic React components for rendering help content
- Simple documentation display
- Limited built-in functionality

**Proposed State:**

- Complete documentation platform with CLI tools
- Pluggable analytics and router adapters
- Advanced features (related docs, TOC, multi-portal)
- Framework-agnostic architecture
- Enterprise-ready security and performance

---

## 1. Analytics Adapter System

### Priority: ⭐⭐⭐⭐⭐ CRITICAL

### Current Implementation

**Location:** `/src/lib/help-analytics-adapter.ts`

```typescript
export interface AnalyticsAdapter {
  onView: (articleId: string) => Promise<void>;
  onRating: (articleId: string, helpful: boolean) => Promise<void>;
  onFeedback: (articleId: string, feedback: string) => Promise<void>;
}

export function createSupabaseAnalyticsAdapter(
  config: SupabaseAnalyticsConfig
): AnalyticsAdapter {
  const { portal } = config;

  return {
    async onView(articleId: string): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('help_page_views').insert({
        user_id: user.id,
        portal,
        document: articleId,
      });
    },
    // ... more methods
  };
}
```

### Proposed Package API

```typescript
// Core interface that all adapters implement
export interface AnalyticsAdapter {
  // Page view tracking
  onView(context: AnalyticsContext): Promise<void>;

  // User feedback
  onRating(context: AnalyticsContext, rating: number): Promise<void>;
  onFeedback(context: AnalyticsContext, feedback: string): Promise<void>;

  // Search tracking
  onSearch?(query: string, results: number): Promise<void>;

  // Navigation tracking
  onNavigation?(from: string, to: string): Promise<void>;

  // Time tracking
  onTimeSpent?(documentId: string, seconds: number): Promise<void>;
}

export interface AnalyticsContext {
  portal: string;
  document: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

// Built-in adapter configurations
export interface SupabaseAdapterConfig {
  supabaseClient: SupabaseClient;
  portal: string;
  tables?: {
    pageViews?: string;
    ratings?: string;
    feedback?: string;
  };
  anonymousTracking?: boolean;
}

export interface GoogleAnalyticsConfig {
  measurementId: string;
  portal: string;
  customDimensions?: Record<string, string>;
}

export interface MixpanelAdapterConfig {
  token: string;
  portal: string;
  distinctId?: string;
}

// Factory functions for built-in adapters
export function createSupabaseAdapter(
  config: SupabaseAdapterConfig
): AnalyticsAdapter;
export function createGoogleAnalyticsAdapter(
  config: GoogleAnalyticsConfig
): AnalyticsAdapter;
export function createMixpanelAdapter(
  config: MixpanelAdapterConfig
): AnalyticsAdapter;
export function createConsoleAdapter(config: {
  debug: boolean;
}): AnalyticsAdapter; // For testing

// Composite adapter for multiple backends
export function createCompositeAdapter(
  ...adapters: AnalyticsAdapter[]
): AnalyticsAdapter;
```

### Usage Example

```typescript
import {
  createSupabaseAdapter,
  createGoogleAnalyticsAdapter,
  createCompositeAdapter
} from '@piikeep/web-help/adapters';

// Single adapter
const analytics = createSupabaseAdapter({
  supabaseClient: supabase,
  portal: 'app',
  tables: {
    pageViews: 'help_page_views',
    ratings: 'help_ratings',
    feedback: 'help_feedback'
  }
});

// Multiple adapters
const analytics = createCompositeAdapter(
  createSupabaseAdapter({ supabaseClient: supabase, portal: 'app' }),
  createGoogleAnalyticsAdapter({ measurementId: 'G-XXXXXX', portal: 'app' })
);

// Use in provider
<HelpProvider analytics={analytics}>
  <HelpPage />
</HelpProvider>
```

### Benefits

- ✅ Plug-and-play analytics for any backend
- ✅ Type-safe tracking interface
- ✅ Multiple analytics platforms simultaneously
- ✅ Graceful degradation on errors
- ✅ Anonymous tracking support
- ✅ Easy testing with console adapter

### Implementation Effort

- **Complexity:** Medium
- **Time Estimate:** 2-3 days
- **Dependencies:** None (peer dependencies for specific adapters)
- **Breaking Changes:** No

---

## 2. Static Manifest Generation CLI

### Priority: ⭐⭐⭐⭐⭐ CRITICAL

### Current Implementation

**Location:** `/scripts/generate-help-manifest.mjs`

```javascript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Scans markdown files and generates JSON manifests
async function generatePortalManifest(portalName, docsPath) {
  const documents = {};
  const files = fs.readdirSync(docsPath);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(docsPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    const docId = file.replace('.md', '');
    documents[docId] = {
      id: docId,
      path: `/public/docs/guides/${portalName}/${file}`,
      content,
      metadata: frontmatter,
      portal: portalName,
    };
  }

  return {
    portal: portalName,
    generatedAt: new Date().toISOString(),
    documentCount: Object.keys(documents).length,
    documents,
    navigation: buildNavigation(documents),
  };
}
```

### Proposed Package CLI

```bash
# Install globally or use npx
npm install -g @piikeep/web-help

# Generate manifests
web-help generate \
  --source ./public/docs/guides \
  --output ./src/data/help \
  --portals app,company,admin \
  --format json,typescript \
  --watch

# With config file
web-help generate --config web-help.config.js

# Analyze documentation
web-help analyze \
  --source ./public/docs/guides \
  --report ./docs/help-status.md \
  --check-placeholders \
  --min-words 100

# Fix frontmatter
web-help frontmatter fix \
  --source ./public/docs/guides \
  --add-missing \
  --infer-categories \
  --update-dates \
  --dry-run

# Validate documentation
web-help validate \
  --source ./public/docs/guides \
  --schema ./help-schema.json \
  --strict
```

### Configuration File

```javascript
// web-help.config.js
export default {
  source: './public/docs/guides',
  output: './src/data/help',

  portals: [
    {
      id: 'app',
      name: 'User App',
      path: 'app',
      basePath: '/app/help',
    },
    {
      id: 'company',
      name: 'Company Portal',
      path: 'company',
      basePath: '/company-portal/help',
    },
    {
      id: 'admin',
      name: 'Admin Portal',
      path: 'admin',
      basePath: '/admin-portal/help',
    },
  ],

  manifest: {
    format: ['json', 'typescript'],
    generateTypes: true,
    generateCombined: true,
    navigation: {
      groupBy: 'category',
      sortBy: 'order',
      includeHidden: false,
    },
  },

  frontmatter: {
    required: ['title', 'description', 'category'],
    defaults: {
      version: '1.0',
      order: 999,
    },
    infer: {
      title: 'first-heading',
      description: 'first-paragraph',
      category: 'filename-prefix',
    },
  },

  validation: {
    minWords: 100,
    checkLinks: true,
    checkImages: true,
    allowedCategories: ['Getting Started', 'User Management' /* ... */],
  },

  watch: {
    enabled: process.env.NODE_ENV === 'development',
    debounce: 300,
  },
};
```

### TypeScript Type Generation

```typescript
// Auto-generated: help-manifest.types.ts
export interface DocumentMetadata {
  title: string;
  description?: string;
  category?: string;
  order?: number;
  tags?: string[];
  lastUpdated?: string;
  version?: string | number;
  prevDoc?: string | null;
  nextDoc?: string | null;
  hidden?: boolean;
}

export interface Document {
  id: string;
  path: string;
  content: string;
  metadata: DocumentMetadata;
  portal: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  order: number;
  hidden?: boolean;
}

export interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

export interface Navigation {
  items: NavigationCategory[];
}

export interface PortalManifest {
  portal: string;
  generatedAt: string;
  documentCount: number;
  documents: Record<string, Document>;
  navigation: Navigation;
}

export interface CombinedManifest {
  generatedAt: string;
  portals: Record<string, PortalManifest>;
}
```

### Benefits

- ✅ Zero-config manifest generation
- ✅ TypeScript type safety
- ✅ Watch mode for development
- ✅ Frontmatter inference and validation
- ✅ Documentation analysis and reporting
- ✅ Cross-platform CLI tool
- ✅ Extensible via config

### Implementation Effort

- **Complexity:** High
- **Time Estimate:** 5-7 days
- **Dependencies:** gray-matter, commander, chalk, ora
- **Breaking Changes:** No (new feature)

---

## 3. Router Adapter System

### Priority: ⭐⭐⭐⭐ HIGH

### Current Implementation

**Location:** `/src/shared/pages/IntegratedHelpPage.tsx`

```typescript
// Currently tightly coupled to React Router
import { useParams, useNavigate } from 'react-router-dom';

const { document } = useParams<{ document?: string }>();
const navigate = useNavigate();

// Navigate to document
navigate(`/${portal}/help/${docId}`);
```

### Proposed Package API

```typescript
// Core router interface
export interface RouterAdapter {
  // Get current path
  getCurrentPath(): string;

  // Navigate to path
  navigate(path: string, options?: NavigationOptions): void;

  // Subscribe to path changes
  onPathChange(callback: (path: string) => void): () => void;

  // Get path parameters
  getParams(): Record<string, string>;

  // Build URL with base path
  buildUrl(path: string, portal?: string): string;
}

export interface NavigationOptions {
  replace?: boolean;
  state?: unknown;
  preserveScroll?: boolean;
}

// Built-in adapters
export class ReactRouterAdapter implements RouterAdapter {
  constructor(
    private navigate: NavigateFunction,
    private location: Location,
    private params: Params
  ) {}

  getCurrentPath(): string {
    return this.location.pathname;
  }

  navigate(path: string, options?: NavigationOptions): void {
    this.navigate(path, { replace: options?.replace });
  }

  onPathChange(callback: (path: string) => void): () => void {
    // Implementation using useEffect
  }

  getParams(): Record<string, string> {
    return this.params as Record<string, string>;
  }

  buildUrl(path: string, portal?: string): string {
    // Build URL with base path
  }
}

export class NextRouterAdapter implements RouterAdapter {
  constructor(private router: NextRouter) {}
  // Implementation for Next.js
}

export class VueRouterAdapter implements RouterAdapter {
  constructor(private router: Router) {}
  // Implementation for Vue Router
}

export class BrowserRouterAdapter implements RouterAdapter {
  constructor(private basePath: string = '') {}
  // Implementation using browser history API
}
```

### Usage Example

```typescript
import { ReactRouterAdapter } from '@piikeep/web-help/adapters';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function HelpPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const routerAdapter = new ReactRouterAdapter(navigate, location, params);

  return (
    <HelpProvider router={routerAdapter}>
      <HelpPage />
    </HelpProvider>
  );
}
```

### Benefits

- ✅ Framework-agnostic routing
- ✅ Works with React Router, Next.js, Vue Router, etc.
- ✅ Fallback to browser history API
- ✅ Type-safe navigation
- ✅ Consistent API across frameworks

### Implementation Effort

- **Complexity:** Medium
- **Time Estimate:** 3-4 days
- **Dependencies:** Peer dependencies for each framework
- **Breaking Changes:** No (opt-in feature)

---

## 4. Related Documents Algorithm

### Priority: ⭐⭐⭐⭐ HIGH

### Current Implementation

**Location:** `/src/shared/pages/IntegratedHelpPage.tsx`

```typescript
const findRelatedDocs = useCallback(
  (category: string, currentId: string) => {
    const related: Document[] = [];
    Object.values(manifest.documents).forEach(doc => {
      if (doc.metadata.category === category && doc.id !== currentId) {
        related.push(doc);
      }
    });
    return related.slice(0, 5); // Limit to 5 related docs
  },
  [manifest]
);
```

### Proposed Package API

```typescript
export interface RelatedDocsConfig {
  // Recommendation strategy
  strategy: 'category' | 'tags' | 'content-similarity' | 'hybrid' | 'custom';

  // Maximum results
  maxResults: number;

  // Exclude current document
  excludeCurrent: boolean;

  // Weighting factors (for hybrid strategy)
  weights?: {
    category?: number; // Weight for same category
    tags?: number; // Weight for shared tags
    recency?: number; // Weight for recent docs
    popularity?: number; // Weight for frequently viewed
    similarity?: number; // Weight for content similarity
  };

  // Filters
  filters?: {
    categories?: string[];
    tags?: string[];
    minWords?: number;
    excludeHidden?: boolean;
  };

  // Custom scorer function
  customScorer?: (doc: Document, current: Document) => number;
}

export interface RelatedDoc extends Document {
  score: number;
  reason: string; // Why this doc was recommended
}

// Hook for related documents
export function useRelatedDocs(
  currentDoc: Document,
  manifest: PortalManifest,
  config: Partial<RelatedDocsConfig> = {}
): RelatedDoc[] {
  return useMemo(() => {
    const algorithm = createRelatedDocsAlgorithm(config);
    return algorithm.findRelated(currentDoc, manifest);
  }, [currentDoc, manifest, config]);
}

// Algorithm implementations
export class CategoryBasedAlgorithm {
  findRelated(current: Document, manifest: PortalManifest): RelatedDoc[] {
    // Find docs in same category
  }
}

export class TagBasedAlgorithm {
  findRelated(current: Document, manifest: PortalManifest): RelatedDoc[] {
    // Find docs with shared tags
  }
}

export class ContentSimilarityAlgorithm {
  constructor(private tfidf?: TfIdfVectorizer) {}

  findRelated(current: Document, manifest: PortalManifest): RelatedDoc[] {
    // Use TF-IDF for content similarity
  }
}

export class HybridAlgorithm {
  constructor(private weights: RelatedDocsConfig['weights']) {}

  findRelated(current: Document, manifest: PortalManifest): RelatedDoc[] {
    // Combine multiple signals with weighted scoring
  }
}
```

### Advanced Features

```typescript
// Analytics-driven recommendations
export interface AnalyticsBasedConfig extends RelatedDocsConfig {
  analytics: AnalyticsAdapter;
  includePopular: boolean;
  includeSequential: boolean; // Docs users typically read in sequence
  userBehavior?: {
    userId?: string;
    readHistory?: string[];
  };
}

// Real-time collaborative filtering
export class CollaborativeFilteringAlgorithm {
  constructor(private analytics: AnalyticsAdapter) {}

  async findRelated(current: Document): Promise<RelatedDoc[]> {
    // "Users who read this also read..."
  }
}
```

### Usage Example

```typescript
import { useRelatedDocs } from '@piikeep/web-help';

function DocumentView({ document, manifest }) {
  const relatedDocs = useRelatedDocs(document, manifest, {
    strategy: 'hybrid',
    maxResults: 5,
    weights: {
      category: 0.4,
      tags: 0.3,
      recency: 0.2,
      popularity: 0.1
    }
  });

  return (
    <div>
      <h2>Related Documentation</h2>
      {relatedDocs.map(doc => (
        <Card key={doc.id}>
          <h3>{doc.metadata.title}</h3>
          <p>{doc.reason}</p>
          <Badge>Score: {doc.score.toFixed(2)}</Badge>
        </Card>
      ))}
    </div>
  );
}
```

### Benefits

- ✅ Multiple recommendation strategies
- ✅ Configurable weighting
- ✅ Analytics-driven suggestions
- ✅ Content similarity using TF-IDF
- ✅ Collaborative filtering
- ✅ Custom scoring functions

### Implementation Effort

- **Complexity:** High
- **Time Estimate:** 5-6 days
- **Dependencies:** natural (for NLP), stopword (for TF-IDF)
- **Breaking Changes:** No (new feature)

---

## 5. Multi-Portal Context Management

### Priority: ⭐⭐⭐ MEDIUM-HIGH

### Current Implementation

**Location:** `/src/shared/pages/IntegratedHelpPage.tsx`

```typescript
const manifest = useMemo(() => {
  const manifests: Record<string, any> = {
    app: appManifest,
    company: companyManifest,
    admin: adminManifest,
  };
  return manifests[portal] as PortalManifest;
}, [portal]);
```

### Proposed Package API

```typescript
export interface PortalConfig {
  id: string;
  name: string;
  basePath: string;
  manifest: PortalManifest;
  theme?: PortalTheme;
  features?: FeatureFlags;
  analytics?: AnalyticsAdapter;
  customComponents?: ComponentOverrides;
}

export interface PortalTheme {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logo?: string;
  favicon?: string;
  customCss?: string;
}

export interface FeatureFlags {
  search?: boolean;
  feedback?: boolean;
  ratings?: boolean;
  toc?: boolean;
  relatedDocs?: boolean;
  breadcrumbs?: boolean;
  printMode?: boolean;
  darkMode?: boolean;
}

export interface ComponentOverrides {
  Header?: React.ComponentType;
  Footer?: React.ComponentType;
  Sidebar?: React.ComponentType;
  DocumentView?: React.ComponentType;
}

// Multi-portal provider
export interface HelpPortalProviderProps {
  portals: PortalConfig[];
  defaultPortal: string;
  router?: RouterAdapter;
  analytics?: AnalyticsAdapter;
  children: React.ReactNode;
}

export function HelpPortalProvider(props: HelpPortalProviderProps): JSX.Element;

// Hook for portal context
export function useHelpPortal() {
  return {
    currentPortal: PortalConfig;
    portals: PortalConfig[];
    switchPortal: (portalId: string) => void;
    getPortalConfig: (portalId: string) => PortalConfig | undefined;
    isPortalActive: (portalId: string) => boolean;
  };
}

// Hook for portal-aware navigation
export function usePortalNavigation() {
  return {
    navigateToDoc: (docId: string, portal?: string) => void;
    navigateToPortal: (portalId: string) => void;
    getCurrentDoc: () => Document | undefined;
    getCurrentPortal: () => PortalConfig;
  };
}
```

### Usage Example

```typescript
import { HelpPortalProvider, useHelpPortal } from '@piikeep/web-help';

// App setup
function App() {
  const portals = [
    {
      id: 'app',
      name: 'User App',
      basePath: '/app/help',
      manifest: appManifest,
      theme: { colors: { primary: '#3b82f6' } },
      features: { search: true, feedback: true }
    },
    {
      id: 'company',
      name: 'Company Portal',
      basePath: '/company-portal/help',
      manifest: companyManifest,
      theme: { colors: { primary: '#10b981' } }
    },
    {
      id: 'admin',
      name: 'Admin Portal',
      basePath: '/admin-portal/help',
      manifest: adminManifest,
      theme: { colors: { primary: '#8b5cf6' } },
      features: { search: true, ratings: false }
    }
  ];

  return (
    <HelpPortalProvider portals={portals} defaultPortal="app">
      <HelpRouter />
    </HelpPortalProvider>
  );
}

// Portal switcher component
function PortalSwitcher() {
  const { currentPortal, portals, switchPortal } = useHelpPortal();

  return (
    <select value={currentPortal.id} onChange={e => switchPortal(e.target.value)}>
      {portals.map(portal => (
        <option key={portal.id} value={portal.id}>
          {portal.name}
        </option>
      ))}
    </select>
  );
}
```

### Benefits

- ✅ Centralized portal management
- ✅ Portal-specific theming
- ✅ Feature flags per portal
- ✅ Isolated manifests
- ✅ Cross-portal navigation
- ✅ Portal-aware search

### Implementation Effort

- **Complexity:** Medium
- **Time Estimate:** 4-5 days
- **Dependencies:** React Context API
- **Breaking Changes:** No (opt-in feature)

---

## 6. Table of Contents Generator

### Priority: ⭐⭐⭐ MEDIUM

### Current Implementation

**Location:** `/src/shared/pages/IntegratedHelpPage.tsx`

```typescript
const generateTableOfContents = useCallback((markdownContent: string) => {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = markdownContent.split('\n');

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level, text, id });
    }
  });

  return headings;
}, []);
```

### Proposed Package API

```typescript
export interface TocConfig {
  // Heading levels to include
  minDepth: number;      // Default: 2 (H2)
  maxDepth: number;      // Default: 4 (H4)

  // Filtering
  minHeadings: number;   // Don't show TOC if fewer headings
  excludePatterns?: RegExp[];
  includeH1?: boolean;

  // Behavior
  scrollOffset: number;  // Offset for scroll position
  smoothScroll: boolean;
  updateOnScroll: boolean; // Track active heading

  // Styling
  activeClass: string;
  indentSize: number;    // Pixels per level

  // ID generation
  idGenerator?: (text: string) => string;
  slugify?: 'github' | 'simple' | 'custom';
}

export interface TocHeading {
  level: number;
  text: string;
  id: string;
  children?: TocHeading[];
}

// Hook for table of contents
export function useToc(
  markdown: string,
  config: Partial<TocConfig> = {}
) {
  return {
    headings: TocHeading[];
    flatHeadings: TocHeading[];
    activeId: string | null;
    scrollToHeading: (id: string) => void;
    isActive: (id: string) => boolean;
  };
}

// Component for table of contents
export interface TocProps {
  headings: TocHeading[];
  activeId?: string;
  onHeadingClick?: (id: string) => void;
  className?: string;
  renderHeading?: (heading: TocHeading) => React.ReactNode;
}

export function TableOfContents(props: TocProps): JSX.Element;
```

### Advanced Features

```typescript
// Nested TOC structure
export function buildNestedToc(headings: TocHeading[]): TocHeading[] {
  // Builds hierarchical tree structure
}

// Intersection observer for active tracking
export function useActiveHeading(
  headings: TocHeading[],
  options?: IntersectionObserverInit
): string | null;

// Smooth scroll utility
export function scrollToElement(
  elementId: string,
  options?: ScrollOptions
): void;
```

### Usage Example

```typescript
import { useToc, TableOfContents } from '@piikeep/web-help';

function DocumentView({ markdown }) {
  const { headings, activeId, scrollToHeading } = useToc(markdown, {
    minDepth: 2,
    maxDepth: 4,
    scrollOffset: 80,
    smoothScroll: true
  });

  if (headings.length < 3) return null;

  return (
    <aside className="toc-sidebar">
      <h3>On This Page</h3>
      <TableOfContents
        headings={headings}
        activeId={activeId}
        onHeadingClick={scrollToHeading}
      />
    </aside>
  );
}
```

### Benefits

- ✅ Automatic TOC generation
- ✅ Active heading tracking
- ✅ Smooth scroll behavior
- ✅ Nested structure support
- ✅ Configurable depth and filtering
- ✅ Custom ID generation

### Implementation Effort

- **Complexity:** Low-Medium
- **Time Estimate:** 2-3 days
- **Dependencies:** None
- **Breaking Changes:** No (new feature)

---

## 7. Markdown Link Transformer

### Priority: ⭐⭐⭐ MEDIUM

### Current Implementation

**Location:** `/src/shared/pages/IntegratedHelpPage.tsx`

```typescript
const customComponents: Components = {
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith('http');
    const isAnchor = href?.startsWith('#');

    if (isAnchor) {
      return <a href={href} {...props}>{children}</a>;
    }

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }

    // Internal link - remove .md extension
    const cleanHref = href?.replace(/\.md$/, '') || '';
    const fullPath = `/${portal}/help/${cleanHref}`;

    return <Link to={fullPath} {...props}>{children}</Link>;
  }
};
```

### Proposed Package API

```typescript
export interface LinkTransformConfig {
  // Base configuration
  basePath: string;
  portalPrefix?: string;

  // Link processing
  stripExtensions?: string[];      // ['.md', '.html']
  preserveAnchors?: boolean;       // Keep #hash
  preserveQueryParams?: boolean;   // Keep ?params

  // External links
  externalTarget?: '_blank' | '_self';
  externalRel?: string;            // 'noopener noreferrer'
  externalClassName?: string;
  externalIcon?: React.ComponentType;

  // Internal links
  internalComponent?: React.ComponentType<any>;
  internalClassName?: string;

  // Custom transformation
  transformHref?: (href: string, context: LinkContext) => string;
  isExternal?: (href: string) => boolean;
  shouldTransform?: (href: string) => boolean;
}

export interface LinkContext {
  currentDoc: string;
  portal: string;
  isExternal: boolean;
  isAnchor: boolean;
  hasExtension: boolean;
}

export interface TransformedLink {
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  component?: React.ComponentType;
}

// Link transformer utility
export function createLinkTransformer(
  config: LinkTransformConfig
) {
  return {
    transform(href: string, context: Partial<LinkContext>): TransformedLink;
    isExternal(href: string): boolean;
    buildInternalUrl(href: string, portal: string): string;
  };
}

// React component for transformed links
export interface SmartLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  config?: Partial<LinkTransformConfig>;
  portal?: string;
}

export function SmartLink(props: SmartLinkProps): JSX.Element;

// Markdown component with smart links
export function createMarkdownComponents(
  config: LinkTransformConfig
): Components {
  return {
    a: (props) => <SmartLink {...props} config={config} />
  };
}
```

### Usage Example

```typescript
import { createLinkTransformer, createMarkdownComponents } from '@piikeep/web-help';
import ReactMarkdown from 'react-markdown';

function DocumentView({ content, portal }) {
  const linkConfig = {
    basePath: `/${portal}/help`,
    stripExtensions: ['.md'],
    preserveAnchors: true,
    externalTarget: '_blank',
    externalRel: 'noopener noreferrer',
    internalComponent: Link // React Router Link
  };

  const components = createMarkdownComponents(linkConfig);

  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  );
}
```

### Advanced Features

```typescript
// Link validation
export interface LinkValidationConfig {
  checkInternal: boolean;
  checkExternal: boolean;
  validateAnchors: boolean;
}

export function validateLinks(
  markdown: string,
  manifest: PortalManifest,
  config: LinkValidationConfig
): LinkValidationResult[];

// Link analytics
export interface LinkClickEvent {
  href: string;
  isExternal: boolean;
  fromDoc: string;
  toDoc?: string;
  timestamp: Date;
}

export function trackLinkClick(
  event: LinkClickEvent,
  analytics: AnalyticsAdapter
): void;
```

### Benefits

- ✅ Intelligent link handling
- ✅ Auto-detection of internal/external
- ✅ Extension stripping
- ✅ Security attributes
- ✅ Custom transformation rules
- ✅ Link validation
- ✅ Analytics tracking

### Implementation Effort

- **Complexity:** Low-Medium
- **Time Estimate:** 2-3 days
- **Dependencies:** None
- **Breaking Changes:** No (new feature)

---

## 8. Search Functionality

### Priority: ⭐⭐⭐ MEDIUM

### Current State

**Status:** Not implemented in PIIKeep

### Proposed Package API

```typescript
export interface SearchConfig {
  // Search algorithm
  algorithm: 'fuzzy' | 'exact' | 'semantic' | 'hybrid';

  // Search fields
  fields: {
    title: number;       // Weight: 3
    description: number; // Weight: 2
    content: number;     // Weight: 1
    tags: number;        // Weight: 2
  };

  // Result configuration
  maxResults: number;
  minScore: number;
  highlightMatches: boolean;
  excerptLength: number;

  // Filters
  filters?: {
    portals?: string[];
    categories?: string[];
    tags?: string[];
  };

  // Performance
  debounce: number;
  caseSensitive: boolean;
  stopWords?: string[];
}

export interface SearchResult {
  document: Document;
  score: number;
  matches: SearchMatch[];
  excerpt: string;
}

export interface SearchMatch {
  field: string;
  text: string;
  highlights: [number, number][];
}

// Search hook
export function useSearch(
  manifests: PortalManifest[],
  config: Partial<SearchConfig> = {}
) {
  return {
    query: string;
    results: SearchResult[];
    isSearching: boolean;
    search: (query: string) => void;
    clear: () => void;
    filters: SearchFilters;
    setFilters: (filters: SearchFilters) => void;
  };
}

// Search component
export interface SearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  showFilters?: boolean;
  showRecentSearches?: boolean;
  config?: Partial<SearchConfig>;
}

export function SearchBox(props: SearchBoxProps): JSX.Element;

// Search index builder
export class SearchIndex {
  constructor(manifests: PortalManifest[], config?: SearchConfig);

  search(query: string): SearchResult[];
  addDocument(doc: Document): void;
  removeDocument(docId: string): void;
  rebuild(): void;
  export(): SerializedIndex;
  import(index: SerializedIndex): void;
}
```

### Advanced Features

```typescript
// Fuzzy search with Levenshtein distance
export class FuzzySearchAlgorithm {
  search(query: string, index: SearchIndex): SearchResult[];
}

// Semantic search with embeddings
export class SemanticSearchAlgorithm {
  constructor(private embeddings: EmbeddingModel);
  search(query: string, index: SearchIndex): Promise<SearchResult[]>;
}

// Search analytics
export interface SearchAnalytics {
  trackSearch(query: string, resultsCount: number): void;
  trackResultClick(query: string, result: SearchResult, position: number): void;
  getPopularSearches(limit: number): Promise<PopularSearch[]>;
  getFailedSearches(limit: number): Promise<string[]>;
}
```

### Usage Example

```typescript
import { useSearch, SearchBox } from '@piikeep/web-help';

function HelpPage({ manifests }) {
  const { results, search, isSearching } = useSearch(manifests, {
    algorithm: 'fuzzy',
    maxResults: 10,
    highlightMatches: true
  });

  return (
    <div>
      <SearchBox
        onSearch={search}
        showFilters
        config={{ debounce: 300 }}
      />

      {isSearching && <Spinner />}

      <SearchResults results={results} />
    </div>
  );
}
```

### Benefits

- ✅ Full-text search across portals
- ✅ Fuzzy and semantic search
- ✅ Configurable scoring
- ✅ Result highlighting
- ✅ Search analytics
- ✅ Filter support

### Implementation Effort

- **Complexity:** High
- **Time Estimate:** 7-10 days
- **Dependencies:** fuse.js or lunr.js, optional: ML embeddings
- **Breaking Changes:** No (new feature)

---

## 9. Frontmatter Management Tools

### Priority: ⭐⭐ LOW-MEDIUM

### Current Implementation

**Location:** `/scripts/fix-help-frontmatter.mjs`

```javascript
function addOrUpdateFrontmatter(filePath, metadata) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: existingFrontmatter, content } = matter(fileContent);

  const updatedFrontmatter = {
    ...existingFrontmatter,
    ...metadata,
  };

  const newContent = matter.stringify(content, updatedFrontmatter);
  fs.writeFileSync(filePath, newContent, 'utf-8');
}
```

### Proposed Package CLI

```bash
# Fix frontmatter
web-help frontmatter fix \
  --source ./docs \
  --add-missing \
  --infer-categories \
  --update-dates \
  --dry-run

# Validate frontmatter
web-help frontmatter validate \
  --source ./docs \
  --schema ./frontmatter-schema.json \
  --strict

# Transform frontmatter
web-help frontmatter transform \
  --source ./docs \
  --rename "lastUpdated:updatedAt" \
  --add "author:Default Author"

# Extract frontmatter
web-help frontmatter extract \
  --source ./docs \
  --output frontmatter.json \
  --format json
```

### Schema Definition

```yaml
# frontmatter-schema.yaml
title:
  type: string
  required: true
  minLength: 5
  maxLength: 100

description:
  type: string
  required: true
  minLength: 20
  maxLength: 200

category:
  type: string
  required: true
  enum:
    - Getting Started
    - User Management
    - Data Contracts
    # ...

order:
  type: number
  required: false
  default: 999
  min: 1
  max: 9999

tags:
  type: array
  items:
    type: string
  required: false

lastUpdated:
  type: string
  format: date-time
  required: false

version:
  type: [string, number]
  required: false
  default: '1.0'
```

### Benefits

- ✅ Automated frontmatter management
- ✅ Schema validation
- ✅ Batch transformations
- ✅ Missing field detection
- ✅ Date updates
- ✅ Category inference

### Implementation Effort

- **Complexity:** Low-Medium
- **Time Estimate:** 2-3 days
- **Dependencies:** gray-matter, ajv (JSON schema validation)
- **Breaking Changes:** No (CLI tool)

---

## 10. Documentation Analytics Dashboard

### Priority: ⭐⭐ LOW-MEDIUM

### Current State

**Status:** Not implemented

### Proposed Package Features

```typescript
export interface AnalyticsDashboardProps {
  analytics: AnalyticsAdapter;
  portals: string[];
  dateRange?: [Date, Date];
}

export function AnalyticsDashboard(props: AnalyticsDashboardProps): JSX.Element;

// Metrics
export interface DocumentMetrics {
  views: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  rating: number;
  feedbackCount: number;
  bounceRate: number;
}

export function useDocumentMetrics(
  documentId: string,
  portal: string,
  dateRange?: [Date, Date]
): DocumentMetrics;

// Popular documents
export function usePopularDocuments(
  portal: string,
  limit: number
): Document[];

// Search analytics
export function useSearchAnalytics(
  portal: string,
  dateRange?: [Date, Date]
) {
  return {
    topSearches: SearchQuery[];
    failedSearches: string[];
    avgResultsCount: number;
    clickThroughRate: number;
  };
}
```

### Benefits

- ✅ Built-in analytics dashboard
- ✅ Document performance metrics
- ✅ Search analytics
- ✅ User behavior insights
- ✅ Content optimization recommendations

### Implementation Effort

- **Complexity:** High
- **Time Estimate:** 7-10 days
- **Dependencies:** Charting library (recharts/visx)
- **Breaking Changes:** No (new feature)

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)

**Priority: Critical**

1. ✅ Analytics Adapter System
2. ✅ Router Adapter System
3. ✅ Multi-Portal Context Management

**Deliverables:**

- Framework-agnostic adapters
- Type-safe interfaces
- Documentation and examples

### Phase 2: Developer Tools (Weeks 3-4)

**Priority: High**

4. ✅ Static Manifest Generation CLI
5. ✅ Frontmatter Management Tools
6. ✅ Documentation Validation

**Deliverables:**

- CLI tools with watch mode
- Config file support
- TypeScript type generation
- Validation schemas

### Phase 3: Enhanced Features (Weeks 5-6)

**Priority: Medium-High**

7. ✅ Related Documents Algorithm
8. ✅ Table of Contents Generator
9. ✅ Markdown Link Transformer

**Deliverables:**

- Smart recommendations
- Auto-generated TOC
- Link transformation utilities

### Phase 4: Advanced Features (Weeks 7-8)

**Priority: Medium**

10. ✅ Full-Text Search
11. ✅ Analytics Dashboard
12. ✅ Theme System

**Deliverables:**

- Search with multiple algorithms
- Visual analytics dashboard
- Customizable theming

---

## Package Structure

```
@piikeep/web-help/
├── src/
│   ├── components/           # React components
│   │   ├── DocumentView.tsx
│   │   ├── SearchBox.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   └── ...
│   │
│   ├── adapters/            # Framework adapters
│   │   ├── analytics/
│   │   │   ├── SupabaseAdapter.ts
│   │   │   ├── GoogleAnalyticsAdapter.ts
│   │   │   ├── MixpanelAdapter.ts
│   │   │   └── ConsoleAdapter.ts
│   │   └── router/
│   │       ├── ReactRouterAdapter.ts
│   │       ├── NextRouterAdapter.ts
│   │       ├── VueRouterAdapter.ts
│   │       └── BrowserRouterAdapter.ts
│   │
│   ├── hooks/               # React hooks
│   │   ├── useRelatedDocs.ts
│   │   ├── useSearch.ts
│   │   ├── useToc.ts
│   │   ├── useHelpPortal.ts
│   │   └── useAnalytics.ts
│   │
│   ├── algorithms/          # Core algorithms
│   │   ├── related-docs/
│   │   │   ├── CategoryBased.ts
│   │   │   ├── TagBased.ts
│   │   │   ├── ContentSimilarity.ts
│   │   │   └── Hybrid.ts
│   │   └── search/
│   │       ├── FuzzySearch.ts
│   │       ├── ExactSearch.ts
│   │       └── SemanticSearch.ts
│   │
│   ├── cli/                 # CLI tools
│   │   ├── commands/
│   │   │   ├── generate.ts
│   │   │   ├── analyze.ts
│   │   │   ├── validate.ts
│   │   │   └── frontmatter.ts
│   │   └── index.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── link-transformer.ts
│   │   ├── markdown-parser.ts
│   │   ├── toc-generator.ts
│   │   └── slugify.ts
│   │
│   └── types/               # TypeScript types
│       ├── manifest.ts
│       ├── analytics.ts
│       ├── search.ts
│       └── config.ts
│
├── bin/                     # CLI entry point
│   └── web-help.js
│
├── examples/                # Usage examples
│   ├── react-router/
│   ├── nextjs/
│   ├── vue/
│   └── vanilla/
│
└── docs/                    # Package documentation
    ├── getting-started.md
    ├── api-reference.md
    ├── adapters.md
    ├── cli.md
    └── migration-guide.md
```

---

## Breaking Changes Strategy

### Version 1.0.0 Goals

- ✅ All core features implemented
- ✅ Comprehensive TypeScript types
- ✅ Full documentation
- ✅ Production-ready
- ✅ Stable API

### Deprecation Policy

- Features marked deprecated in 0.x
- Removal in 1.0.0
- Migration guides provided
- Codemods for automated migration

---

## Success Metrics

### Developer Experience

- ⏱️ **Setup Time:** < 5 minutes from install to working help system
- 📚 **Documentation Coverage:** 100% of public API
- 🎯 **TypeScript Coverage:** 100% with strict mode
- 🧪 **Test Coverage:** > 80%

### Performance

- 🚀 **Initial Load:** < 2s for first document
- ⚡ **Search Speed:** < 100ms for queries
- 💾 **Bundle Size:** < 50KB gzipped (core)
- 📦 **Manifest Generation:** < 5s for 100 docs

### Adoption

- ⭐ **GitHub Stars:** Target 500+ in 6 months
- 📥 **Downloads:** Target 1000+/month
- 🔧 **Production Usage:** 10+ projects
- 🐛 **Issue Response:** < 48 hours

---

## Conclusion

Moving these features into `@piikeep/web-help` will transform it from a simple documentation renderer into a **comprehensive, enterprise-ready documentation platform** that can compete with solutions like Docusaurus, VitePress, and GitBook.

### Key Advantages

1. **Framework Agnostic:** Works with React, Next.js, Vue, etc.
2. **Fully Featured:** Search, analytics, multi-portal, related docs
3. **Developer Friendly:** CLI tools, TypeScript, great DX
4. **Production Ready:** Security, performance, accessibility
5. **Extensible:** Plugin system, custom adapters, themes

### Next Steps

1. **Community Feedback:** Gather input on proposed features
2. **RFC Process:** Formal proposal for major changes
3. **Prototype:** Build proof-of-concept for core features
4. **Alpha Release:** Early access for testing
5. **Beta Release:** Feature complete, bug fixing
6. **v1.0.0 Release:** Stable, production-ready

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-05  
**Status:** Proposal - Awaiting Approval
