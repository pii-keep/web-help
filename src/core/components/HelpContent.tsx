/**
 * HelpContent Component for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/HelpContent
 *
 * Headless component for rendering help article content.
 */

import { forwardRef, useMemo } from 'react';
import parse, {
  domToReact,
  type HTMLReactParserOptions,
  type DOMNode,
  type Element,
} from 'html-react-parser';
import type { HelpContentProps } from '../types/components';

/**
 * HelpContent is a headless component for rendering HTML content.
 * It provides semantic class names for styling and uses html-react-parser
 * for safe HTML rendering without XSS vulnerabilities.
 */
export const HelpContent = forwardRef<HTMLDivElement, HelpContentProps>(
  function HelpContent(
    {
      content,
      renderCodeBlock,
      renderImage,
      renderLink,
      components,
      className = '',
      ...props
    },
    ref,
  ) {
    const options: HTMLReactParserOptions = useMemo(
      () => ({
        replace(domNode: DOMNode) {
          if (domNode.type !== 'tag') return;

          const element = domNode as Element;

          // MDX component placeholder renderer
          if (
            element.name === 'div' &&
            element.attribs?.class?.includes('help-mdx-placeholder') &&
            components
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

          // Custom code block renderer
          if (element.name === 'pre' && renderCodeBlock) {
            const codeNode = element.children[0] as Element;
            if (codeNode?.type === 'tag' && codeNode.name === 'code') {
              const textContent = domToReact(codeNode.children as DOMNode[]);
              return renderCodeBlock({
                language:
                  codeNode.attribs?.class?.replace('language-', '') || '',
                code: typeof textContent === 'string' ? textContent : '',
              }) as React.ReactElement;
            }
          }

          // Custom image renderer
          if (element.name === 'img' && renderImage) {
            return renderImage({
              src: element.attribs.src || '',
              alt: element.attribs.alt || '',
            }) as React.ReactElement;
          }

          // Custom link renderer
          if (element.name === 'a' && renderLink) {
            return renderLink({
              href: element.attribs.href || '',
              children: domToReact(element.children as DOMNode[]),
            }) as React.ReactElement;
          }
        },
      }),
      [renderCodeBlock, renderImage, renderLink, components],
    );

    return (
      <div
        ref={ref}
        className={`help-content ${className}`.trim()}
        data-component='content'
        {...props}
      >
        {parse(content, options)}
      </div>
    );
  },
);

HelpContent.displayName = 'HelpContent';
