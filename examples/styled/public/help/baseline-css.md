---
title: Baseline CSS Guide
category: styling
tags: [css, styling, baseline]
order: 1
---

# Baseline CSS Guide

This example demonstrates the baseline CSS styling provided by @piikeep/web-help.

## What is Baseline CSS?

Baseline CSS is a pre-built stylesheet that provides sensible default styling for all help components. It's designed to:

- Provide a professional look out of the box
- Be easily customizable with CSS variables
- Work well on all devices (responsive)
- Follow modern design principles

## Using Baseline CSS

To use baseline CSS in your project:

```typescript
import '@piikeep/web-help/baseline.css';
```

## Customization

You can customize the baseline styles using CSS variables:

```css
:root {
  --help-primary-color: #007bff;
  --help-text-color: #333;
  --help-background: #fff;
  --help-border-radius: 8px;
  --help-spacing: 1rem;
}
```

## Dark Mode

The baseline CSS supports dark mode through CSS variables:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --help-background: #1a1a1a;
    --help-text-color: #e0e0e0;
  }
}
```
