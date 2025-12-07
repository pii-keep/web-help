# Styling Guide

The @piikeep/web-help library is **completely headless** - it provides zero default styling. This gives you maximum flexibility to match your application's design system.

## Quick Start with Baseline CSS

For a ready-to-use design, import the baseline stylesheet:

```tsx
import '@piikeep/web-help/baseline.css';
```

This provides professional styling for all help components with:

- Light and dark theme support
- Responsive layouts
- Semantic CSS variables for customization
- Modern, accessible design

## Theming with CSS Variables

The baseline CSS uses CSS custom properties (variables) for easy customization:

```css
:root {
  /* Colors */
  --help-color-bg: #ffffff;
  --help-color-bg-secondary: #f5f7fa;
  --help-color-bg-tertiary: #e8ecf0;
  --help-color-text: #1a1a2e;
  --help-color-text-secondary: #4a5568;
  --help-color-text-muted: #718096;
  --help-color-border: #e2e8f0;
  --help-color-primary: #0066cc;
  --help-color-primary-hover: #0052a3;
  --help-color-primary-light: #e6f0ff;
  --help-color-success: #10b981;
  --help-color-warning: #f59e0b;
  --help-color-danger: #ef4444;
  --help-color-info: #3b82f6;

  /* Shadows */
  --help-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --help-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --help-shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);

  /* Border Radius */
  --help-radius-sm: 4px;
  --help-radius-md: 8px;
  --help-radius-lg: 12px;
}
```

### Custom Theme Example

Override specific variables to match your brand:

```css
:root {
  --help-color-primary: #ff6b6b;
  --help-color-primary-hover: #ff5252;
  --help-color-primary-light: #ffe0e0;
  --help-radius-md: 16px;
}
```

### Dark Mode

The baseline CSS includes dark mode support. Toggle by adding/removing the `data-theme="dark"` attribute:

```tsx
<div data-theme='dark'>
  <HelpProvider>{/* Your help components */}</HelpProvider>
</div>
```

Or apply to the entire document:

```tsx
useEffect(() => {
  document.documentElement.setAttribute(
    'data-theme',
    isDark ? 'dark' : 'light',
  );
}, [isDark]);
```

## Bring Your Own Styles

All components use semantic class names following the `help-*` pattern:

### Component Classes

| Component           | Class Names                                                            | Data Attributes                |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| **HelpPage**        | `help-page`, `help-page-sidebar`, `help-page-main`                     | -                              |
| **HelpNavigation**  | `help-navigation`, `help-nav-list`, `help-nav-item`, `help-nav-button` | `data-active`, `data-category` |
| **HelpContent**     | `help-content`                                                         | `data-loading`                 |
| **HelpBreadcrumbs** | `help-breadcrumbs`, `help-breadcrumb-item`                             | `aria-current`                 |
| **HelpPagination**  | `help-pagination`, `help-pagination-prev`, `help-pagination-next`      | -                              |
| **HelpSearch**      | `help-search`, `help-search-input`, `help-search-dropdown`             | -                              |
| **HelpCallout**     | `help-callout`, `help-callout-info`, `help-callout-warning`            | -                              |
| **HelpAccordion**   | `help-accordion`, `help-accordion-item`, `help-accordion-trigger`      | `data-expanded`                |
| **HelpTabs**        | `help-tabs`, `help-tabs-list`, `help-tabs-tab`                         | `data-active`                  |

### Custom CSS Example

```css
.help-page {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.help-navigation {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.help-nav-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.help-nav-button:hover {
  background: #e2e8f0;
}

.help-nav-item[data-active='true'] .help-nav-button {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}
```

## Tailwind CSS

Use Tailwind utility classes via className props:

```tsx
<HelpPage
  className='max-w-7xl mx-auto p-8'
  sidebarClassName='w-64 bg-gray-50 rounded-lg p-4'
  mainClassName='flex-1 prose prose-slate'
>
  {/* Content */}
</HelpPage>
```

### Tailwind Config

Add help component classes to your safelist if using PurgeCSS:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@piikeep/web-help/**/*.js',
  ],
  safelist: [
    { pattern: /^help-/ }, // Preserve all help-* classes
  ],
};
```

## CSS-in-JS

Use styled-components, Emotion, or other CSS-in-JS libraries:

```tsx
import styled from 'styled-components';
import { HelpPage } from '@piikeep/web-help';

const StyledHelpPage = styled(HelpPage)`
  .help-page-sidebar {
    background: ${(props) => props.theme.colors.gray[100]};
    border-radius: ${(props) => props.theme.radii.lg};
  }

  .help-nav-item[data-active='true'] {
    background: ${(props) => props.theme.colors.primary};
    color: white;
  }
`;
```

## CSS Modules

Import styles scoped to your component:

```tsx
import styles from './HelpPage.module.css';
import { HelpPage } from '@piikeep/web-help';

function MyHelpPage() {
  return (
    <HelpPage className={styles.helpPage} sidebarClassName={styles.sidebar} />
  );
}
```

```css
/* HelpPage.module.css */
.helpPage {
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  background: var(--bg-secondary);
  padding: 1.5rem;
}

.helpPage :global(.help-nav-button) {
  /* Target nested help components */
  padding: 0.75rem 1rem;
}
```

## Component-Specific Styling

### Navigation States

```css
/* Category headers */
.help-nav-item[data-category='true'] > .help-nav-button {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
}

/* Active article */
.help-nav-item[data-active='true'] > .help-nav-button {
  background: var(--active-bg);
  color: var(--active-color);
}

/* Hover states */
.help-nav-button:hover {
  background: var(--hover-bg);
}
```

### Content Styling

```css
.help-content h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.help-content h2 {
  font-size: 1.5rem;
  margin-top: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.help-content code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
}

.help-content pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
```

### Callouts

```css
.help-callout {
  padding: 1rem;
  border-left: 4px solid;
  border-radius: 4px;
  margin: 1rem 0;
}

.help-callout-info {
  background: #eff6ff;
  border-color: #3b82f6;
}

.help-callout-warning {
  background: #fffbeb;
  border-color: #f59e0b;
}

.help-callout-danger {
  background: #fef2f2;
  border-color: #ef4444;
}
```

## Responsive Design

The baseline CSS includes mobile-first responsive styles:

```css
@media (max-width: 768px) {
  .help-page {
    flex-direction: column;
  }

  .help-page-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--help-color-border);
  }
}
```

Override for your breakpoints:

```css
@media (max-width: 1024px) {
  .help-page {
    grid-template-columns: 200px 1fr;
  }
}

@media (max-width: 640px) {
  .help-page {
    grid-template-columns: 1fr;
  }

  .help-page-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    height: 100vh;
    transition: left 0.3s;
  }

  .help-page-sidebar[data-open='true'] {
    left: 0;
  }
}
```

## Animation

Add transitions for smooth interactions:

```css
.help-nav-button {
  transition: all 0.2s ease-in-out;
}

.help-accordion-content {
  transition: max-height 0.3s ease-out;
  overflow: hidden;
}

.help-search-dropdown {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility

Ensure your custom styles maintain accessibility:

```css
/* Focus states */
.help-nav-button:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .help-nav-item[data-active='true'] {
    outline: 2px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

1. **Use CSS Variables**: Makes theming easier and reduces duplication
2. **Leverage Data Attributes**: Use `data-active`, `data-loading`, etc. for state-based styling
3. **Maintain Specificity**: Use class selectors over element selectors for easier overrides
4. **Test Dark Mode**: If supporting dark mode, test all components in both themes
5. **Responsive First**: Design for mobile and scale up
6. **Accessibility**: Ensure sufficient color contrast (WCAG 2.1 AA minimum)
7. **Performance**: Minimize CSS bundle size by importing only what you need

## Examples

Check the `/examples` directory for complete styling examples:

- **`examples/basic/`** - Minimal setup with baseline CSS
- **`examples/styled/`** - Custom theme with CSS variables
- **`examples/with-cli/`** - Production-ready implementation
- **`examples/multi-format/`** - Different content formats

## Troubleshooting

### Styles Not Applying

1. Ensure CSS is imported before components:

   ```tsx
   import '@piikeep/web-help/baseline.css'; // First
   import { HelpProvider } from '@piikeep/web-help'; // Then
   ```

2. Check CSS specificity - your custom styles may need `!important` or higher specificity

3. Verify class names match - inspect element in DevTools

### Dark Mode Not Working

1. Ensure `data-theme="dark"` is on a parent element
2. Check CSS variable overrides aren't blocking dark theme
3. Verify dark theme variables are defined

### Layout Issues

1. Check parent container constraints (width, height)
2. Verify flexbox/grid browser support
3. Test in different browsers and viewports

## Support

For styling questions or issues:

- Open an issue on GitHub
- Check examples in `/examples` directory
- See component documentation in `/docs`
