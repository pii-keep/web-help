/**
 * HelpPage Component (v2) for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/HelpPage
 *
 * Simplified headless component that works with HelpProvider-v2.
 * Provides sensible defaults with the ability to override.
 */

import { forwardRef, useMemo } from 'react';
import parse, {
  type HTMLReactParserOptions,
  type DOMNode,
  type Element,
} from 'html-react-parser';
import type { NavigationItem, HelpPageProps } from '../types/components';
import { useHelp } from '../context/HelpProvider';
import { HelpNavigation } from './HelpNavigation';
import { HelpBreadcrumbs } from './navigation/HelpBreadcrumbs';
import { HelpPagination } from './navigation/HelpPagination';

/**
 * Strip the first H1 from rendered HTML if it matches the article title.
 * Also extracts content from full HTML documents (strips <html>, <head>, <body> tags).
 */
function stripDuplicateTitle(html: string, title: string): string {
  let content = html;

  // Extract body content if this is a full HTML document
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1].trim();
  }

  // Remove duplicate H1 if it matches the title
  const h1Pattern = /<h1[^>]*>([^<]+)<\/h1>/i;
  const match = content.match(h1Pattern);

  if (match && match[1].trim() === title.trim()) {
    return content.replace(h1Pattern, '').trim();
  }

  return content;
}

/**
 * HelpPage is a headless container component for rendering help articles.
 * Works with HelpProvider-v2 for a clean, minimal architecture.
 *
 * Provides sensible defaults:
 * - Sidebar navigation with collapsible categories
 * - Breadcrumbs for navigation context
 * - Table of contents for long articles
 * - Pagination for next/previous navigation
 *
 * All defaults can be disabled or overridden via props.
 */
export const HelpPage = forwardRef<HTMLDivElement, HelpPageProps>(
  function HelpPage(
    {
      article,
      articleId,
      renderHeader,
      renderFooter,
      renderSidebar,
      showBreadcrumbs = true,
      showTOC = true,
      showPagination = true,
      showNavigation = true,
      components,
      className = '',
      children,
      ...props
    },
    ref,
  ) {
    const {
      currentArticle,
      isLoading,
      error,
      loadArticle,
      navigation,
      categories,
      getAllArticles,
      articlesReady,
    } = useHelp();

    // Use provided article, or fall back to context article
    const displayArticle = article ?? currentArticle;

    // Parser options for MDX component rendering
    const parserOptions: HTMLReactParserOptions = useMemo(
      () => ({
        replace(domNode: DOMNode) {
          if (domNode.type !== 'tag' || !components) return;

          const element = domNode as Element;

          // MDX component placeholder renderer
          if (
            element.name === 'div' &&
            element.attribs?.class?.includes('help-mdx-placeholder')
          ) {
            const componentName = element.attribs['data-component'];
            const propsJson = element.attribs['data-props'];

            if (componentName && propsJson) {
              try {
                const componentProps = JSON.parse(propsJson);
                const Component = components[componentName];

                if (Component) {
                  // Transform props for specific components
                  const transformedProps = { ...componentProps };

                  // HelpCodeBlock: map children to code prop
                  if (
                    componentName === 'HelpCodeBlock' &&
                    transformedProps.children
                  ) {
                    transformedProps.code = transformedProps.children;
                    delete transformedProps.children;
                  }

                  return <Component {...transformedProps} />;
                }
              } catch (error) {
                console.warn(
                  `Failed to render MDX component ${componentName}:`,
                  error,
                );
              }
            }
          }
        },
      }),
      [components],
    );

    // Build navigation items from categories
    const navigationItems = useMemo((): NavigationItem[] => {
      const allArticles = getAllArticles();

      const items = categories.map((category) => {
        const categoryArticles = allArticles
          .filter((art) => art.metadata?.category === category.id)
          .sort((a, b) => (a.metadata?.order ?? 0) - (b.metadata?.order ?? 0)); // Sort by order

        return {
          id: category.id,
          label: category.name,
          isCategory: true,
          children: categoryArticles.map((art) => ({
            id: `${category.id}/${art.id}`, // Composite key: category/article
            label: art.title,
            path: `#${art.id}`,
            isCategory: false, // Explicitly mark as not a category
          })),
        };
      });

      return items;
    }, [categories, getAllArticles, articlesReady]);

    // Load article by ID if provided and no article prop
    if (articleId && !article && !isLoading) {
      loadArticle(articleId);
    }

    // Loading state
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={`help-page help-page-loading ${className}`.trim()}
          data-state='loading'
          {...props}
        >
          <div className='help-page-loader' aria-live='polite'>
            {children ?? 'Loading...'}
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div
          ref={ref}
          className={`help-page help-page-error ${className}`.trim()}
          data-state='error'
          role='alert'
          {...props}
        >
          <div className='help-page-error-message'>
            {children ?? error.message}
          </div>
        </div>
      );
    }

    // Empty state
    if (!displayArticle) {
      return (
        <div
          ref={ref}
          className={`help-page help-page-empty ${className}`.trim()}
          data-state='empty'
          {...props}
        >
          {children ?? (
            <div className='help-page-empty-message'>No article selected</div>
          )}
        </div>
      );
    }

    // Ready state - render article with defaults
    return (
      <div
        ref={ref}
        className={`help-page ${className}`.trim()}
        data-state='ready'
        data-article-id={displayArticle.id}
        {...props}
      >
        {/* Sidebar - custom or default navigation */}
        {(showNavigation || renderSidebar) && (
          <aside className='help-page-sidebar' data-component='sidebar'>
            {renderSidebar ? (
              renderSidebar()
            ) : (
              <div className='help-sidebar-content'>
                <HelpNavigation
                  items={navigationItems}
                  activeId={
                    displayArticle && navigation?.category
                      ? `${navigation.category.id}/${displayArticle.id}`
                      : undefined
                  }
                  onItemSelect={(itemId) => {
                    // Ignore clicks on categories (only load articles)
                    if (!itemId) return;

                    // Extract article ID from composite key (category/article)
                    const articleId = itemId.includes('/')
                      ? itemId.split('/')[1]
                      : itemId;

                    loadArticle(articleId);
                  }}
                  collapsible={true}
                  defaultCollapsed={false}
                />
              </div>
            )}
          </aside>
        )}

        {/* Main content area */}
        <main className='help-page-main'>
          {/* Breadcrumbs */}
          {showBreadcrumbs && navigation?.category && (
            <nav className='help-page-breadcrumbs' data-component='breadcrumbs'>
              <HelpBreadcrumbs
                items={[
                  { id: 'home', label: 'Home' },
                  {
                    id: navigation.category.id,
                    label: navigation.category.name || 'Category',
                  },
                  {
                    id: displayArticle.id,
                    label: displayArticle.title,
                    current: true,
                  },
                ]}
              />
            </nav>
          )}

          {/* Header */}
          {renderHeader ? (
            <header className='help-page-header' data-component='header'>
              {renderHeader(displayArticle)}
            </header>
          ) : (
            <header className='help-page-header' data-component='header'>
              <h1 className='help-page-title'>{displayArticle.title}</h1>
              {displayArticle.description && (
                <p className='help-page-description'>
                  {displayArticle.description}
                </p>
              )}
            </header>
          )}

          {/* Content wrapper with TOC */}
          <div className='help-page-content-wrapper'>
            {/* Article content */}
            <article className='help-page-article' data-component='article'>
              {displayArticle.renderedContent ? (
                <div className='help-content'>
                  {parse(
                    stripDuplicateTitle(
                      displayArticle.renderedContent,
                      displayArticle.title,
                    ),
                    parserOptions,
                  )}
                </div>
              ) : (
                <div className='help-content'>{displayArticle.content}</div>
              )}
            </article>

            {/* Table of Contents - disabled until toc property added to HelpArticle */}
            {/* {showTOC && (
              <aside className='help-page-toc' data-component='toc'>
                <HelpTOC entries={[]} />
              </aside>
            )} */}
          </div>

          {/* Pagination */}
          {showPagination &&
            navigation &&
            (navigation.previous || navigation.next) && (
              <nav className='help-page-pagination' data-component='pagination'>
                <HelpPagination
                  navigation={{
                    prev: navigation.previous
                      ? {
                          id: navigation.previous.id,
                          title: navigation.previous.title,
                        }
                      : undefined,
                    next: navigation.next
                      ? {
                          id: navigation.next.id,
                          title: navigation.next.title,
                        }
                      : undefined,
                  }}
                  onPrev={() =>
                    navigation.previous && loadArticle(navigation.previous.id)
                  }
                  onNext={() =>
                    navigation.next && loadArticle(navigation.next.id)
                  }
                />
              </nav>
            )}

          {/* Footer */}
          {renderFooter ? (
            <footer className='help-page-footer' data-component='footer'>
              {renderFooter(displayArticle)}
            </footer>
          ) : (
            <footer className='help-page-footer' data-component='footer'>
              {displayArticle.metadata?.updatedAt && (
                <p className='help-page-updated'>
                  Last updated:{' '}
                  {new Date(
                    displayArticle.metadata.updatedAt,
                  ).toLocaleDateString()}
                </p>
              )}
            </footer>
          )}
        </main>
      </div>
    );
  },
);

HelpPage.displayName = 'HelpPage';
