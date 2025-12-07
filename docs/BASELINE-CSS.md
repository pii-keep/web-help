# Using Baseline CSS

The `@piikeep/web-help` package includes a ready-to-use baseline stylesheet that provides professional styling for all help components.

## Installation

```bash
npm install @piikeep/web-help
```

## Basic Usage

Import the baseline CSS in your main entry file:

```tsx
import '@piikeep/web-help/baseline.css';
import { HelpProvider, HelpPage } from '@piikeep/web-help';

function App() {
  return (
    <HelpProvider
      config={
        {
          /* your config */
        }
      }
    >
      <HelpPage />
    </HelpProvider>
  );
}
```

That's it! All help components will now have professional styling.

## What's Included

- **CSS Variables**: Easy theming with custom properties
- **Dark Mode**: Automatic dark theme support via `data-theme="dark"`
- **Responsive**: Mobile-first layouts that adapt to all screen sizes
- **All Components**: Navigation, search, breadcrumbs, pagination, callouts, accordions, tabs, etc.

## Customizing the Theme

Override CSS variables in your own stylesheet:

```css
/* custom.css */
:root {
  /* Brand colors */
  --help-color-primary: #8b5cf6;
  --help-color-primary-hover: #7c3aed;
  --help-color-primary-light: #f5f3ff;

  /* Typography */
  --help-font-family: 'Inter', sans-serif;

  /* Spacing */
  --help-radius-md: 12px;
  --help-radius-lg: 16px;
}
```

Import order matters - custom styles should come after baseline:

```tsx
import '@piikeep/web-help/baseline.css';
import './custom.css'; // Your overrides
```

## Available CSS Variables

See `src/styles/baseline.css` for the complete list. Key variables:

### Colors

```css
--help-color-bg
--help-color-bg-secondary
--help-color-bg-tertiary
--help-color-text
--help-color-text-secondary
--help-color-text-muted
--help-color-border
--help-color-primary
--help-color-primary-hover
--help-color-primary-light
--help-color-success
--help-color-warning
--help-color-danger
--help-color-info
```

### Shadows

```css
--help-shadow-sm
--help-shadow-md
--help-shadow-lg
```

### Border Radius

```css
--help-radius-sm
--help-radius-md
--help-radius-lg
```

## Dark Mode

Toggle dark mode by setting the `data-theme` attribute:

```tsx
function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light',
    );
  }, [isDark]);

  return (
    <>
      <button onClick={() => setIsDark(!isDark)}>Toggle Dark Mode</button>
      <HelpProvider>
        <HelpPage />
      </HelpProvider>
    </>
  );
}
```

## Alternative Approaches

### Don't Want to Use Baseline CSS?

The library is completely headless - you can:

1. **Use Tailwind**: Pass className props with Tailwind utilities
2. **Write Custom CSS**: Target the semantic `.help-*` classes
3. **Use CSS-in-JS**: styled-components, Emotion, etc.

See [STYLING.md](./STYLING.md) for detailed examples of each approach.

### Want to Modify Baseline CSS?

1. Copy `node_modules/@piikeep/web-help/dist/styles/baseline.css` to your project
2. Modify as needed
3. Import your copy instead of the package version

## Examples

The `/examples` directory contains complete examples:

- **`examples/basic/`** - Minimal setup with baseline CSS
- **`examples/styled/`** - Custom theme using CSS variables
- **`examples/with-cli/`** - Production-ready implementation (source for baseline.css)

## File Size

The baseline CSS is **~19KB uncompressed** (~4KB gzipped). Tree-shaking is not available for CSS, so the entire file is included if imported.

To reduce bundle size:

- Copy baseline.css and remove unused component styles
- Or write custom CSS targeting only the components you use

## Browser Support

The baseline CSS uses modern CSS features:

- CSS Custom Properties (variables)
- Flexbox and CSS Grid
- `clamp()` for responsive sizing (fallbacks included)

Supported browsers:

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

For older browsers, add PostCSS with autoprefixer to your build.

## Troubleshooting

### Styles Not Applying

**Problem**: Components render but have no styling.

**Solution**: Ensure you imported the CSS:

```tsx
import '@piikeep/web-help/baseline.css';
```

### Custom Styles Not Working

**Problem**: CSS variable overrides aren't taking effect.

**Solution**: Check import order - custom styles must come after baseline:

```tsx
import '@piikeep/web-help/baseline.css'; // First
import './custom.css'; // Then your overrides
```

### Dark Mode Not Working

**Problem**: Dark theme not applying when `data-theme="dark"` is set.

**Solution**: Ensure the attribute is on a parent of the help components:

```tsx
<div data-theme='dark'>
  <HelpProvider>
    <HelpPage />
  </HelpProvider>
</div>
```

Or apply to document root:

```tsx
document.documentElement.setAttribute('data-theme', 'dark');
```

## TypeScript

The baseline CSS has no TypeScript types (it's just CSS). Import as-is:

```tsx
import '@piikeep/web-help/baseline.css';
```

If using TypeScript strict mode and getting errors, add a type declaration:

```ts
// types/css.d.ts
declare module '@piikeep/web-help/baseline.css';
```

## Next Steps

- Read [STYLING.md](./STYLING.md) for advanced styling techniques
- Explore `/examples` for complete implementations
- Check [README.md](../README.md) for full API documentation
