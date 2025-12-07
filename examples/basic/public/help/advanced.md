---
title: Advanced Topics
category: advanced
tags: [advanced, customization]
order: 1
---

# Advanced Topics

Deep dive into advanced features and customization options.

## Custom Components

You can customize how content is rendered:

```typescript
<HelpPage
  renderHeader={(article) => (
    <header>
      <h1>{article.title}</h1>
      <p>Last updated: {article.metadata.lastModified}</p>
    </header>
  )}
/>
```

## Hooks

Use the provided hooks to build custom experiences:

- `useHelp()` - Access help context
- `useHelpNavigation()` - Navigation controls
- `useHelpSearch()` - Search functionality
- `useUserPreferences()` - User preferences

## Storage Adapters

Choose how to store user preferences:

- LocalStorage (default)
- SessionStorage
- Cookies
- Custom adapter

## Event Callbacks

React to user interactions:

```typescript
<HelpProvider
  config={{
    callbacks: {
      onArticleView: (articleId) => console.log('Viewed:', articleId),
      onSearch: (query) => console.log('Searched:', query),
    },
  }}
/>
```
