/**
 * Interactive Sandbox Component for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/advanced/HelpSandbox
 *
 * A headless component for embedding interactive code sandboxes
 * from CodeSandbox, StackBlitz, and other platforms.
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Props for the HelpSandbox component.
 */
export interface HelpSandboxProps {
  /** Sandbox ID or URL */
  id: string;
  /** Sandbox provider */
  provider: SandboxProvider;
  /** Sandbox title for accessibility */
  title?: string;
  /** File to open by default */
  initialFile?: string;
  /** Height of the sandbox (default: '500px') */
  height?: string | number;
  /** Whether to show the file explorer */
  showExplorer?: boolean;
  /** Whether to show the navigation bar */
  showNavbar?: boolean;
  /** Theme for the sandbox */
  theme?: 'light' | 'dark';
  /** Whether to auto-run the code */
  autoRun?: boolean;
  /** Whether to lazy load the sandbox */
  lazyLoad?: boolean;
  /** Callback when sandbox loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional CSS class name */
  className?: string;
  /** Labels for i18n */
  labels?: HelpSandboxLabels;
}

/**
 * Supported sandbox providers.
 */
export type SandboxProvider =
  | 'codesandbox'
  | 'stackblitz'
  | 'codepen'
  | 'jsfiddle'
  | 'replit';

/**
 * Labels for sandbox internationalization.
 */
export interface HelpSandboxLabels {
  loading?: string;
  loadError?: string;
  openInNew?: string;
  expand?: string;
  collapse?: string;
}

/**
 * Default labels.
 */
const defaultLabels: Required<HelpSandboxLabels> = {
  loading: 'Loading sandbox...',
  loadError: 'Failed to load sandbox',
  openInNew: 'Open in new tab',
  expand: 'Expand',
  collapse: 'Collapse',
};

/**
 * Provider configurations.
 */
const providerConfigs: Record<SandboxProvider, ProviderConfig> = {
  codesandbox: {
    baseUrl: 'https://codesandbox.io/embed',
    buildUrl: (id, options) => {
      const params = new URLSearchParams();
      if (options.initialFile) params.set('module', options.initialFile);
      if (options.showExplorer !== undefined)
        params.set('hidenavigation', options.showExplorer ? '0' : '1');
      if (options.theme) params.set('theme', options.theme);
      if (options.autoRun) params.set('runonclick', '0');
      return `https://codesandbox.io/embed/${id}?${params.toString()}`;
    },
    directUrl: (id) => `https://codesandbox.io/s/${id}`,
  },
  stackblitz: {
    baseUrl: 'https://stackblitz.com/edit',
    buildUrl: (id, options) => {
      const params = new URLSearchParams();
      if (options.initialFile) params.set('file', options.initialFile);
      if (options.showExplorer !== undefined)
        params.set('hideExplorer', options.showExplorer ? '0' : '1');
      if (options.showNavbar !== undefined)
        params.set('hideNavigation', options.showNavbar ? '0' : '1');
      params.set('embed', '1');
      return `https://stackblitz.com/edit/${id}?${params.toString()}`;
    },
    directUrl: (id) => `https://stackblitz.com/edit/${id}`,
  },
  codepen: {
    baseUrl: 'https://codepen.io',
    buildUrl: (id, options) => {
      // CodePen ID format: user/pen/slug
      const [user, , slug] = id.split('/');
      const params = new URLSearchParams();
      params.set('default-tab', 'result');
      if (options.theme === 'dark') params.set('theme-id', 'dark');
      return `https://codepen.io/${user}/embed/${slug}?${params.toString()}`;
    },
    directUrl: (id) => {
      const [user, , slug] = id.split('/');
      return `https://codepen.io/${user}/pen/${slug}`;
    },
  },
  jsfiddle: {
    baseUrl: 'https://jsfiddle.net',
    buildUrl: (id, options) => {
      const theme = options.theme === 'dark' ? 'dark' : 'light';
      return `https://jsfiddle.net/${id}/embedded/result,js,html,css/${theme}/`;
    },
    directUrl: (id) => `https://jsfiddle.net/${id}`,
  },
  replit: {
    baseUrl: 'https://replit.com',
    buildUrl: (id, options) => {
      const params = new URLSearchParams();
      params.set('embed', 'true');
      if (options.theme === 'dark') params.set('theme', 'dark');
      return `https://replit.com/${id}?${params.toString()}`;
    },
    directUrl: (id) => `https://replit.com/${id}`,
  },
};

/**
 * Provider configuration.
 */
interface ProviderConfig {
  baseUrl: string;
  buildUrl: (id: string, options: HelpSandboxProps) => string;
  directUrl: (id: string) => string;
}

/**
 * HelpSandbox component - Embeds interactive code sandboxes.
 */
export const HelpSandbox: React.FC<HelpSandboxProps> = ({
  id,
  provider,
  title,
  initialFile,
  height = '500px',
  showExplorer = true,
  showNavbar = true,
  theme,
  autoRun = true,
  lazyLoad = true,
  onLoad,
  onError,
  className,
  labels: customLabels,
}) => {
  const labels = { ...defaultLabels, ...customLabels };

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isExpanded, setIsExpanded] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get provider config
  const config = providerConfigs[provider];

  // Build sandbox URL
  const sandboxUrl = config.buildUrl(id, {
    id,
    provider,
    initialFile,
    height,
    showExplorer,
    showNavbar,
    theme,
    autoRun,
    lazyLoad,
  });

  // Direct URL for opening in new tab
  const directUrl = config.directUrl(id);

  // Height style
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const expandedHeight = isExpanded ? '80vh' : heightStyle;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isVisible]);

  // Handle iframe load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle iframe error
  const handleError = () => {
    const err = new Error(labels.loadError);
    setError(err.message);
    setIsLoading(false);
    onError?.(err);
  };

  return (
    <div
      ref={containerRef}
      className={`help-sandbox help-sandbox-${provider} ${className ?? ''}`}
      data-loading={isLoading}
      data-error={!!error}
      data-expanded={isExpanded}
    >
      {/* Header */}
      <div className='help-sandbox-header'>
        {title && <span className='help-sandbox-title'>{title}</span>}

        <div className='help-sandbox-actions'>
          <button
            type='button'
            className='help-sandbox-expand-button'
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? labels.collapse : labels.expand}
          >
            {isExpanded ? labels.collapse : labels.expand}
          </button>
          <a
            href={directUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='help-sandbox-open-button'
          >
            {labels.openInNew}
          </a>
        </div>
      </div>

      {/* Sandbox content */}
      <div className='help-sandbox-content' style={{ height: expandedHeight }}>
        {isLoading && (
          <div className='help-sandbox-loading' aria-live='polite'>
            {labels.loading}
          </div>
        )}

        {error && (
          <div className='help-sandbox-error' role='alert'>
            {error}
          </div>
        )}

        {isVisible && (
          <iframe
            ref={iframeRef}
            src={sandboxUrl}
            title={title ?? `${provider} sandbox`}
            className='help-sandbox-iframe'
            onLoad={handleLoad}
            onError={handleError}
            allow='accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking'
            sandbox='allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts'
            loading={lazyLoad ? 'lazy' : 'eager'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              opacity: isLoading ? 0 : 1,
            }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Helper to extract sandbox ID from full URL.
 * Uses proper URL parsing to ensure the domain is actually the host.
 */
export function extractSandboxId(
  url: string,
): { provider: SandboxProvider; id: string } | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null; // Invalid URL
  }

  const hostname = parsedUrl.hostname;

  // CodeSandbox
  if (hostname === 'codesandbox.io' || hostname.endsWith('.codesandbox.io')) {
    const match = url.match(/codesandbox\.io\/(?:s|embed)\/([^/?]+)/);
    if (match) return { provider: 'codesandbox', id: match[1] };
  }

  // StackBlitz
  if (hostname === 'stackblitz.com' || hostname.endsWith('.stackblitz.com')) {
    const match = url.match(/stackblitz\.com\/(?:edit|embed)\/([^/?]+)/);
    if (match) return { provider: 'stackblitz', id: match[1] };
  }

  // CodePen
  if (hostname === 'codepen.io' || hostname.endsWith('.codepen.io')) {
    const match = url.match(/codepen\.io\/([^/]+)\/(?:pen|embed)\/([^/?]+)/);
    if (match)
      return { provider: 'codepen', id: `${match[1]}/pen/${match[2]}` };
  }

  // JSFiddle
  if (hostname === 'jsfiddle.net' || hostname.endsWith('.jsfiddle.net')) {
    const match = url.match(/jsfiddle\.net\/([^/]+)(?:\/([^/]+))?/);
    if (match)
      return {
        provider: 'jsfiddle',
        id: match[2] ? `${match[1]}/${match[2]}` : match[1],
      };
  }

  // Replit
  if (hostname === 'replit.com' || hostname.endsWith('.replit.com')) {
    const match = url.match(/replit\.com\/@([^/]+)\/([^/?]+)/);
    if (match) return { provider: 'replit', id: `@${match[1]}/${match[2]}` };
  }

  return null;
}

export default HelpSandbox;
