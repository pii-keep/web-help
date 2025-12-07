/**
 * Context Index for the Web Help Component Library
 * @module @piikeep-pw/web-help/context
 */

// Old provider - has infinite re-render issues
export {
  HelpProvider as HelpProviderOld,
  useHelpContext,
  useHelpState,
  useHelpActions,
  type HelpProviderProps as HelpProviderOldProps,
  type HelpState,
  type HelpActions,
  type HelpContextValue as HelpContextValueOld,
} from './HelpContext';

// New v2 provider - minimal, stable architecture
export {
  HelpProvider,
  useHelp,
  type HelpProviderProps,
  type HelpConfig,
} from './HelpProvider';

// UserPreferences removed - caused infinite re-render loops
// Will be re-implemented in future version with proper architecture
