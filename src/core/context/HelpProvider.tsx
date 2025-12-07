import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import type { HelpArticle, HelpCategory } from '../types/content';
import type { LoadManifestResult } from '../../devtools/manifestLoader';
import type { HelpConfig as FullHelpConfig } from '../types/config';
import { StaticContentLoader } from '../loaders/staticLoader';
import { createMarkdownParser } from '../loaders/markdownParser';
import { createJsonParser } from '../loaders/jsonParser';
import { createCsvParser } from '../loaders/csvParser';
import { createMdxParser } from '../loaders/mdxParser';

// Minimal config - just what we absolutely need
export interface HelpConfig {
  storagePrefix?: string;
  theme?: 'light' | 'dark' | 'auto';
  /** Full config from help.config.ts - used for formats and other settings */
  fullConfig?: FullHelpConfig;
}

// Simple navigation type
interface Navigation {
  previous: HelpArticle | null;
  next: HelpArticle | null;
  category: HelpCategory | null;
}

// Context value
interface HelpContextValue {
  currentArticle: HelpArticle | null;
  categories: HelpCategory[];
  navigation: Navigation | null;
  isLoading: boolean;
  error: Error | null;
  articlesReady: boolean;
  loadArticle: (articleId: string) => Promise<void>;
  getAllArticles: () => HelpArticle[];
  getArticleById: (id: string) => HelpArticle | undefined;
}

const HelpContext = createContext<HelpContextValue | null>(null);

export interface HelpProviderProps {
  children: ReactNode;
  manifestData: LoadManifestResult;
  config?: HelpConfig;
}

export function HelpProvider({
  children,
  manifestData,
  config = {},
}: HelpProviderProps) {
  // Simple state - no complex reducers
  const [currentArticle, setCurrentArticle] = useState<HelpArticle | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [articlesReady, setArticlesReady] = useState(false);

  // Static data in refs - never changes
  const loaderRef = useRef<StaticContentLoader>();
  const categoriesRef = useRef<HelpCategory[]>(manifestData.categories);
  const navigationRef = useRef<Navigation | null>(null);
  const configRef = useRef(config);

  // Initialize loader once
  useEffect(() => {
    if (!loaderRef.current) {
      loaderRef.current = new StaticContentLoader();

      // Register parsers based on formats in config, or default to markdown
      const formats = config.fullConfig?.content?.formats || ['md'];

      formats.forEach((format) => {
        switch (format) {
          case 'md':
            loaderRef.current!.registerParser(createMarkdownParser());
            break;
          case 'mdx':
            loaderRef.current!.registerParser(createMdxParser());
            break;
          case 'json':
            loaderRef.current!.registerParser(createJsonParser());
            break;
          case 'csv':
            loaderRef.current!.registerParser(createCsvParser());
            break;
        }
      });

      // Register categories
      manifestData.categories.forEach((category) => {
        loaderRef.current!.registerCategory(category);
      });

      // Load content from manifest asynchronously
      loaderRef.current
        .loadFromManifest(
          manifestData.contentManifest,
          manifestData.contentFilenames,
          manifestData.articleCategories,
          manifestData.articleOrder,
          manifestData.articleTitles,
          manifestData.articleDescriptions,
        )
        .then(() => {
          // Mark articles as ready to trigger re-render
          setArticlesReady(true);

          // Load first article after manifest is ready
          const firstArticle = loaderRef.current!.getAllArticles()[0];
          if (firstArticle && !currentArticle) {
            loadArticle(firstArticle.id);
          }
        }); // Build initial navigation - just set to null for now
      // Will be updated when first article loads
      navigationRef.current = null;
    }
  }, []);

  // Update config ref when it changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Load article function - stable reference
  const loadArticle = useRef(async (articleId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const article = await loaderRef.current!.loadArticle(articleId);

      setCurrentArticle(article);

      // Update navigation
      const allArticles = loaderRef.current!.getAllArticles();
      const currentIndex = allArticles.findIndex((a) => a.id === articleId);

      if (currentIndex !== -1) {
        // Find category by checking all articles in each category
        // Since HelpCategory doesn't have articles array, we'll just set category to first one
        const category = categoriesRef.current[0] || null;

        navigationRef.current = {
          previous: allArticles[currentIndex - 1] || null,
          next: allArticles[currentIndex + 1] || null,
          category,
        };
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load article'),
      );
    } finally {
      setIsLoading(false);
    }
  }).current;

  // Helper functions - stable references
  const getAllArticles = useRef(() => {
    if (!loaderRef.current) {
      return [];
    }
    return loaderRef.current!.getAllArticles();
  }).current;

  const getArticleById = useRef((id: string) => {
    if (!loaderRef.current) {
      return undefined;
    }
    return loaderRef.current!.getArticleById(id);
  }).current;

  const value: HelpContextValue = {
    currentArticle,
    categories: categoriesRef.current,
    navigation: navigationRef.current,
    isLoading,
    error,
    articlesReady,
    loadArticle,
    getAllArticles,
    getArticleById,
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp(): HelpContextValue {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
}
