/**
 * Mermaid Diagram Component for the Web Help Component Library
 * @module @privify-pw/web-help/components/advanced/HelpDiagram
 * 
 * A headless component for rendering Mermaid and PlantUML diagrams.
 * Supports lazy loading and accessibility features.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Props for the HelpDiagram component.
 */
export interface HelpDiagramProps {
  /** Diagram source code */
  source: string;
  /** Diagram type */
  type?: 'mermaid' | 'plantuml';
  /** Alt text for accessibility */
  alt?: string;
  /** Caption to display below diagram */
  caption?: string;
  /** Whether to lazy load the diagram renderer */
  lazyLoad?: boolean;
  /** PlantUML server URL for PlantUML diagrams */
  plantumlServer?: string;
  /** Theme for Mermaid diagrams */
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  /** Callback when diagram is rendered */
  onRender?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show copy button */
  showCopyButton?: boolean;
  /** Labels for i18n */
  labels?: HelpDiagramLabels;
}

/**
 * Labels for diagram internationalization.
 */
export interface HelpDiagramLabels {
  loading?: string;
  error?: string;
  copySource?: string;
  copied?: string;
  viewSource?: string;
  hideSource?: string;
}

/**
 * Default labels.
 */
const defaultLabels: Required<HelpDiagramLabels> = {
  loading: 'Loading diagram...',
  error: 'Failed to render diagram',
  copySource: 'Copy source',
  copied: 'Copied!',
  viewSource: 'View source',
  hideSource: 'Hide source',
};

/**
 * Default PlantUML server.
 */
const DEFAULT_PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/svg';

/**
 * HelpDiagram component - Renders Mermaid or PlantUML diagrams.
 */
export const HelpDiagram: React.FC<HelpDiagramProps> = ({
  source,
  type = 'mermaid',
  alt,
  caption,
  lazyLoad = true,
  plantumlServer = DEFAULT_PLANTUML_SERVER,
  theme = 'default',
  onRender,
  onError,
  className,
  showCopyButton = true,
  labels: customLabels,
}) => {
  const labels = { ...defaultLabels, ...customLabels };

  // State
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Render Mermaid diagram
  const renderMermaid = useCallback(async () => {
    try {
      // Dynamic import of Mermaid (must be installed by consumer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mermaid = await import('mermaid' as any) as { default: { initialize: (opts: object) => void; render: (id: string, src: string) => Promise<{ svg: string }> } };
      
      mermaid.default.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: 'strict',
      });

      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { svg } = await mermaid.default.render(id, source);
      
      return svg;
    } catch {
      // Mermaid not installed, return placeholder
      throw new Error('Mermaid library not installed. Install with: npm install mermaid');
    }
  }, [source, theme]);

  // Render PlantUML diagram
  const renderPlantUML = useCallback(async () => {
    // Encode diagram for PlantUML server
    const encoded = encodePlantUML(source);
    const url = `${plantumlServer}/${encoded}`;

    // Fetch SVG from PlantUML server
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to render PlantUML diagram: ${response.statusText}`);
    }

    const svg = await response.text();
    return svg;
  }, [source, plantumlServer]);

  // Main render function
  const renderDiagram = useCallback(async () => {
    if (!isVisible) return;

    setIsLoading(true);
    setError(null);

    try {
      let svg: string;
      
      if (type === 'mermaid') {
        svg = await renderMermaid();
      } else {
        svg = await renderPlantUML();
      }

      setRenderedSvg(svg);
      onRender?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : labels.error;
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [isVisible, type, renderMermaid, renderPlantUML, onRender, onError, labels.error]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isVisible) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazyLoad, isVisible]);

  // Render diagram when visible
  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Copy source to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = source;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [source]);

  return (
    <figure
      ref={containerRef}
      className={`help-diagram help-diagram-${type} ${className ?? ''}`}
      data-loading={isLoading}
      data-error={!!error}
      role="figure"
      aria-label={alt ?? caption ?? 'Diagram'}
    >
      {/* Diagram content */}
      <div className="help-diagram-content">
        {isLoading && (
          <div className="help-diagram-loading" aria-live="polite">
            {labels.loading}
          </div>
        )}

        {error && (
          <div className="help-diagram-error" role="alert">
            <span className="help-diagram-error-message">{error}</span>
            <pre className="help-diagram-source-preview">
              <code>{source.substring(0, 200)}...</code>
            </pre>
          </div>
        )}

        {renderedSvg && !error && (
          <div
            className="help-diagram-svg"
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
            role="img"
            aria-label={alt ?? caption ?? 'Rendered diagram'}
          />
        )}
      </div>

      {/* Actions */}
      <div className="help-diagram-actions">
        {showCopyButton && (
          <button
            type="button"
            className="help-diagram-copy-button"
            onClick={handleCopy}
            aria-label={labels.copySource}
          >
            {copied ? labels.copied : labels.copySource}
          </button>
        )}
        <button
          type="button"
          className="help-diagram-source-toggle"
          onClick={() => setShowSource(!showSource)}
          aria-expanded={showSource}
        >
          {showSource ? labels.hideSource : labels.viewSource}
        </button>
      </div>

      {/* Source code */}
      {showSource && (
        <pre className="help-diagram-source">
          <code>{source}</code>
        </pre>
      )}

      {/* Caption */}
      {caption && (
        <figcaption className="help-diagram-caption">{caption}</figcaption>
      )}
    </figure>
  );
};

/**
 * Encode PlantUML source for URL.
 * Uses deflate encoding as per PlantUML specification.
 */
function encodePlantUML(source: string): string {
  // Simple encoding - use TextEncoder for UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(source);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  
  // Use PlantUML's custom base64 encoding
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Helper to detect diagram type from source.
 */
export function detectDiagramType(source: string): 'mermaid' | 'plantuml' | null {
  const trimmed = source.trim().toLowerCase();
  
  // Mermaid indicators
  const mermaidKeywords = [
    'graph ', 'flowchart ', 'sequencediagram', 'classdiagram',
    'statediagram', 'erdiagram', 'gantt', 'pie', 'journey',
    'gitgraph', 'mindmap', 'timeline', 'sankey',
  ];
  
  if (mermaidKeywords.some(kw => trimmed.startsWith(kw))) {
    return 'mermaid';
  }
  
  // PlantUML indicators
  if (trimmed.startsWith('@startuml') || trimmed.startsWith('@startmindmap')) {
    return 'plantuml';
  }
  
  return null;
}

export default HelpDiagram;
