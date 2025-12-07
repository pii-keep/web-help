/**
 * Core Components Index for the Web Help Component Library
 * @module @piikeep-pw/web-help/core/components
 */

// Main components - old versions
export { HelpPage as HelpPageOld } from './HelpPage';
export { HelpContent } from './HelpContent';
export { HelpNavigation } from './HelpNavigation';

// Main components - v2
export { HelpPage } from './HelpPage';
export type { HelpPageProps as HelpPagePropsV2 } from './HelpPage';

// Navigation components
export {
  HelpTOC,
  HelpBreadcrumbs,
  HelpPagination,
  HelpSearch,
} from './navigation';

// Display mode components
export { HelpModal, HelpSidebar } from './display';
