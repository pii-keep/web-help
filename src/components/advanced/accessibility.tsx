/**
 * Accessibility Utilities for the Web Help Component Library
 * @module @privify-pw/web-help/components/advanced/accessibility
 * 
 * Provides accessibility utilities, hooks, and components for
 * WCAG 2.1 AA compliance.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Accessibility Context
// ============================================================================

/**
 * Accessibility preferences.
 */
export interface AccessibilityPreferences {
  /** Reduce motion preference */
  reduceMotion: boolean;
  /** High contrast preference */
  highContrast: boolean;
  /** Screen reader active (best effort detection) */
  screenReaderActive: boolean;
  /** Keyboard navigation mode */
  keyboardNavigation: boolean;
  /** Font size scale (1 = default) */
  fontScale: number;
}

/**
 * Default accessibility preferences.
 */
const defaultPreferences: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  screenReaderActive: false,
  keyboardNavigation: false,
  fontScale: 1,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to detect and track accessibility preferences.
 */
export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect reduce motion preference
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReduceMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      setPreferences((prev) => ({ ...prev, reduceMotion: e.matches }));
    };

    // Detect high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    const handleHighContrast = (e: MediaQueryListEvent | MediaQueryList) => {
      setPreferences((prev) => ({ ...prev, highContrast: e.matches }));
    };

    // Detect keyboard navigation
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setPreferences((prev) => ({ ...prev, keyboardNavigation: true }));
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    const handleMouseDown = () => {
      setPreferences((prev) => ({ ...prev, keyboardNavigation: false }));
    };

    // Initial values
    handleReduceMotion(reduceMotionQuery);
    handleHighContrast(highContrastQuery);

    // Add listeners
    reduceMotionQuery.addEventListener('change', handleReduceMotion);
    highContrastQuery.addEventListener('change', handleHighContrast);
    window.addEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      reduceMotionQuery.removeEventListener('change', handleReduceMotion);
      highContrastQuery.removeEventListener('change', handleHighContrast);
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return preferences;
}

/**
 * Hook for managing focus trap within a container.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean = true
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get focusable elements
    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    // Focus first element
    focusableElements[0].focus();

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = getFocusableElements(container);
      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [active, containerRef]);
}

/**
 * Hook for live announcements to screen readers.
 */
export function useLiveAnnouncer(): {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clear: () => void;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Create or find announcer container
    let container = document.getElementById('help-live-announcer') as HTMLDivElement;

    if (!container) {
      container = document.createElement('div');
      container.id = 'help-live-announcer';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(container);
    }

    containerRef.current = container;

    return () => {
      // Don't remove container on unmount - other components might use it
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!containerRef.current) return;

    containerRef.current.setAttribute('aria-live', priority);
    
    // Clear and set message (ensures screen readers pick up the change)
    containerRef.current.textContent = '';
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.textContent = message;
      }
    });
  }, []);

  const clear = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.textContent = '';
    }
  }, []);

  return { announce, clear };
}

/**
 * Hook for skip link functionality.
 */
export function useSkipLink(targetId: string): {
  skipLinkProps: {
    href: string;
    onClick: (e: React.MouseEvent) => void;
  };
} {
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.removeAttribute('tabindex');
      }
    },
    [targetId]
  );

  return {
    skipLinkProps: {
      href: `#${targetId}`,
      onClick,
    },
  };
}

// ============================================================================
// Components
// ============================================================================

/**
 * Props for SkipLink component.
 */
export interface SkipLinkProps {
  /** Target element ID */
  targetId: string;
  /** Link text */
  children: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skip link component for keyboard navigation.
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children,
  className,
}) => {
  const { skipLinkProps } = useSkipLink(targetId);

  return (
    <a
      {...skipLinkProps}
      className={`help-skip-link ${className ?? ''}`}
    >
      {children}
    </a>
  );
};

/**
 * Props for VisuallyHidden component.
 */
export interface VisuallyHiddenProps {
  /** Content to hide visually but keep accessible */
  children: React.ReactNode;
  /** Whether to render as span (default) or div */
  as?: 'span' | 'div';
}

/**
 * Visually hidden component for screen reader only content.
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  as: Component = 'span',
}) => {
  return (
    <Component className="help-visually-hidden" style={visuallyHiddenStyles}>
      {children}
    </Component>
  );
};

/**
 * Styles for visually hidden content.
 */
const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Props for FocusRing component.
 */
export interface FocusRingProps {
  /** Whether the focus ring is visible */
  visible: boolean;
  /** Element to wrap */
  children: React.ReactElement;
  /** Ring color */
  color?: string;
  /** Ring width */
  width?: number;
  /** Ring offset */
  offset?: number;
}

/**
 * Focus ring component for custom focus indicators.
 */
export const FocusRing: React.FC<FocusRingProps> = ({
  visible,
  children,
  color = '#0066cc',
  width = 2,
  offset = 2,
}) => {
  const style: React.CSSProperties = visible
    ? {
        outline: `${width}px solid ${color}`,
        outlineOffset: `${offset}px`,
      }
    : {};

  const childStyle = (children.props as { style?: React.CSSProperties }).style ?? {};

  return React.cloneElement(children, {
    style: { ...childStyle, ...style },
    'data-focus-visible': visible,
  } as React.HTMLAttributes<HTMLElement>);
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/**
 * Check if an element is focusable.
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1') return false;
  if (element.offsetParent === null) return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

  if (focusableTags.includes(tagName)) return true;
  if (element.hasAttribute('tabindex')) return true;
  if (element.hasAttribute('contenteditable')) return true;

  return false;
}

/**
 * Generate unique IDs for accessibility.
 */
export function generateA11yId(prefix: string = 'help'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * ARIA attributes helper.
 */
export function ariaAttributes(attrs: Record<string, string | boolean | undefined>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;

    const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
    result[ariaKey] = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
  }

  return result;
}

/**
 * Color contrast checker (WCAG 2.1).
 * Returns contrast ratio between two colors.
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements.
 */
export function meetsContrastRequirements(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const requirements = {
    AA: largeText ? 3 : 4.5,
    AAA: largeText ? 4.5 : 7,
  };
  return ratio >= requirements[level];
}

/**
 * Get relative luminance of a color.
 */
function getLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB values.
 */
function parseColor(color: string): [number, number, number] | null {
  // Handle hex colors
  const hex = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex) {
    return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  }

  // Handle short hex colors
  const shortHex = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHex) {
    return [
      parseInt(shortHex[1] + shortHex[1], 16),
      parseInt(shortHex[2] + shortHex[2], 16),
      parseInt(shortHex[3] + shortHex[3], 16),
    ];
  }

  // Handle rgb colors
  const rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) {
    return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  }

  return null;
}

export default {
  useAccessibilityPreferences,
  useFocusTrap,
  useLiveAnnouncer,
  useSkipLink,
  SkipLink,
  VisuallyHidden,
  FocusRing,
  getFocusableElements,
  isFocusable,
  generateA11yId,
  ariaAttributes,
  getContrastRatio,
  meetsContrastRequirements,
};
