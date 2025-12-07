# Quick Start: Baseline CSS

The fastest way to get professional styling for @piikeep/web-help components.

## Installation

```bash
npm install @piikeep/web-help
```

## Basic Usage (3 steps)

### 1. Import CSS

```tsx
import '@piikeep/web-help/baseline.css';
```

### 2. Add Provider

```tsx
import { HelpProvider } from '@piikeep/web-help';

<HelpProvider>
  <App />
</HelpProvider>;
```

### 3. Use Components

```tsx
import { HelpPage } from '@piikeep/web-help';

<HelpPage />;
```

Done! All components now have professional styling.

## Customization

### Change Colors

```css
:root {
  --help-color-primary: #8b5cf6;
  --help-color-primary-hover: #7c3aed;
}
```

### Dark Mode

```tsx
// Add data-theme="dark" attribute
<div data-theme='dark'>
  <HelpProvider>
    <HelpPage />
  </HelpProvider>
</div>
```

### Responsive

Baseline CSS is mobile-first and responsive by default. No configuration needed.

## What You Get

- ✅ Professional design
- ✅ Dark mode support
- ✅ Responsive layouts
- ✅ All components styled
- ✅ CSS variables for theming
- ✅ ~19KB size (~4KB gzipped)

## Documentation

- **Full Guide**: [docs/BASELINE-CSS.md](./BASELINE-CSS.md)
- **Advanced Styling**: [docs/STYLING.md](./STYLING.md)
- **Examples**: `/examples` directory

## Need Help?

- Check [BASELINE-CSS.md](./BASELINE-CSS.md) for troubleshooting
- See `/examples/with-cli` for a complete implementation
- Open an issue on GitHub
