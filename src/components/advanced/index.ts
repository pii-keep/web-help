/**
 * Advanced Components Index for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/advanced
 */

// Diagrams
export {
  HelpDiagram,
  default as HelpDiagramDefault,
  detectDiagramType,
} from './HelpDiagram';

// Sandbox
export {
  HelpSandbox,
  default as HelpSandboxDefault,
  extractSandboxId,
} from './HelpSandbox';

// Analytics
export {
  useHelpAnalytics,
  default as useHelpAnalyticsDefault,
} from './useHelpAnalytics';

// Accessibility
export {
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
} from './accessibility';

// PWA
export {
  usePWA,
  useOfflineContent,
  registerHelpServiceWorker,
  unregisterHelpServiceWorker,
  generateServiceWorkerScript,
} from './pwa';

// Types - Diagrams
export type { HelpDiagramProps, HelpDiagramLabels } from './HelpDiagram';

// Types - Sandbox
export type {
  HelpSandboxProps,
  HelpSandboxLabels,
  SandboxProvider,
} from './HelpSandbox';

// Types - Analytics
export type {
  AnalyticsEventType,
  AnalyticsEvent,
  AnalyticsConfig,
  AnalyticsState,
  UseHelpAnalyticsReturn,
  SessionStats,
} from './useHelpAnalytics';

// Types - Accessibility
export type {
  AccessibilityPreferences,
  SkipLinkProps,
  VisuallyHiddenProps,
  FocusRingProps,
} from './accessibility';

// Types - PWA
export type { PWAConfig, PWAStatus, CacheUsage, CacheItem } from './pwa';
