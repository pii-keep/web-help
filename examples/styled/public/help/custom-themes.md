---
title: Custom Themes
category: advanced
tags: [theming, customization, css]
order: 1
---

# Custom Themes

Create your own custom theme on top of the baseline CSS.

## CSS Variables

The baseline CSS uses CSS variables extensively:

### Colors

```css
--help-primary-color
--help-secondary-color
--help-success-color
--help-warning-color
--help-danger-color
--help-text-color
--help-background
```

### Spacing

```css
--help-spacing-xs
--help-spacing-sm
--help-spacing-md
--help-spacing-lg
--help-spacing-xl
```

### Typography

```css
--help-font-family
--help-font-size-base
--help-line-height
--help-heading-weight
```

## Example Custom Theme

Here's an example of a custom theme:

```css
:root {
  /* Purple theme */
  --help-primary-color: #667eea;
  --help-secondary-color: #764ba2;

  /* Modern spacing */
  --help-spacing: 1.5rem;
  --help-border-radius: 12px;

  /* Custom fonts */
  --help-font-family: 'Inter', sans-serif;
}
```

## Overriding Specific Components

You can also override specific component styles:

```css
.help-navigation {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.help-content {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```
