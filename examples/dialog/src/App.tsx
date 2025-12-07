import {
  HelpModal,
  HelpContent,
  HelpCallout,
  HelpCodeBlock,
  createMarkdownParser,
  ParseResult,
} from '@piikeep/web-help';

import { useEffect, useState } from 'react';

const helpData = `---
title: Getting Started
category: basics
tags: [introduction, setup]
order: 1
---

# Getting Started

Welcome to the help system! This guide will help you get started with using our application.

## What is this application?

This is a demonstration of the @piikeep/web-help library, a comprehensive, headless help system for React applications.

## Key Features

- **Headless Components**: Bring your own styling
- **TypeScript Support**: Full type safety
- **Markdown Content**: Write help content in Markdown
- **Navigation**: Automatic navigation and breadcrumbs
- **Search**: Built-in search functionality

## Next Steps

Check out the [Features Guide](./features.md) to learn more about what you can do.
`;

function ArticleViewer({ article }: { article: ParseResult }) {
  const trackLinkClick = (href: string) => {
    console.log(`Link clicked: ${href}`);
    // Add your analytics tracking code here
  };
  const mdxHtmlContent = `
    <h1>MDX Example</h1>
    <div class="help-mdx-placeholder" data-component="HelpCallout" data-props='{"type":"info","children":"Important note!"}'>
      <span class="help-mdx-placeholder-label">&lt;HelpCallout type="info" (with children) /&gt;</span>
    </div>
  `;

  const htmlContent = '<a href="/docs/guide">Guide</a>';
  const imageContent = '<img src="/image.png" alt="My Image" />';
  const codeContent = `
    <h1>Code Example</h1>
    <pre><code class="language-typescript">
      const x = 42;
    </code></pre>
  `;

  return (
    <HelpContent
      content={article.html}
      className='my-custom-class'
      // Custom image rendering with lazy loading
      renderImage={({ src, alt }) => (
        <img src={src} alt={alt} loading='lazy' className='article-image' />
      )}
      // Custom link rendering for analytics
      renderLink={({ href, children }) => (
        <a
          href={href}
          onClick={() => trackLinkClick(href)}
          target={href.startsWith('http') ? '_blank' : undefined}
        >
          {children}
        </a>
      )}
      // MDX component support
      components={{
        HelpCallout,
        HelpCodeBlock,
        // Add any custom components you use in MDX
      }}
    />
  );
}

function ImageViewer() {
  const trackLinkClick = (href: string) => {
    console.log(`Link clicked: ${href}`);
    // Add your analytics tracking code here
  };
  const imageContent =
    '<img style="height: 25px; width: 25px;" src="/piikeep-logo.png" alt="My Image" />';

  return (
    <HelpContent
      content={imageContent}
      className='my-custom-class'
      // Custom image rendering with lazy loading
      renderImage={({ src, alt }) => (
        <img src={src} alt={alt} loading='lazy' className='article-image' />
      )}
      // Custom link rendering for analytics
      renderLink={({ href, children }) => (
        <a
          href={href}
          onClick={() => trackLinkClick(href)}
          target={href.startsWith('http') ? '_blank' : undefined}
        >
          {children}
        </a>
      )}
      // MDX component support
      components={{
        HelpCallout,
        HelpCodeBlock,
        // Add any custom components you use in MDX
      }}
    />
  );
}

function App() {
  const [showModel, setShowModal] = useState(false);
  const [type, setType] = useState<'article' | 'image'>('article');
  const [parsedContent, setParsedContent] = useState<ParseResult | null>(null);

  useEffect(() => {
    async function fetchParsedContent() {
      const markedDownParser = createMarkdownParser();
      const parsedContent: ParseResult = await markedDownParser.parse(helpData);
      setParsedContent(parsedContent);
    }
    fetchParsedContent();
  }, []);
  return (
    <div>
      <HelpModal
        open={showModel}
        onClose={() => {
          setShowModal(false);
        }}
        title='Help Dialog Example'
        closeOnBackdrop={true}
        closeOnEscape={true}
      >
        {type === 'image' && <ImageViewer />}
        {type === 'article' && (
          <ArticleViewer article={parsedContent ?? { renderedContent: '' }} />
        )}
      </HelpModal>
      {!showModel && (
        <>
          <h1>Dialog Example</h1>
          <button
            className='btn'
            onClick={() => {
              setShowModal(true);
              setType('article');
            }}
          >
            Show Article in Modal
          </button>
          <button
            className='btn'
            onClick={() => {
              setShowModal(true);
              setType('image');
            }}
          >
            Show Image in Modal
          </button>
        </>
      )}
    </div>
  );
}

export default App;
