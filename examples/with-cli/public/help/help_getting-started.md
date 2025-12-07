---
title: introduction
description: Learn how to get started with our application
category: getting-started
tags:
  - introduction
  - quickstart
order: 1
createdAt: 2025-12-05
updatedAt: 2025-12-05
---

# Getting Started

Welcome to the documentation! This guide will help you get up and running quickly.

## Prerequisites

Before you begin, make sure you have:

- Node.js 18 or later
- npm or yarn package manager

## Installation

Install the package using npm:

```bash
npm install @piikeep/web-help
```

Or using yarn:

```bash
yarn add @piikeep/web-help
```

## Quick Start

1. Import the components you need
2. Wrap your app with the HelpProvider
3. Add help components where needed

```tsx
import { HelpProvider, HelpPage } from '@piikeep/web-help';

function App() {
  return (
    <HelpProvider config={helpConfig}>
      <HelpPage />
    </HelpProvider>
  );
}
```

## Next Steps

- [Configuration Guide](./configuration.md)
- [API Reference](./api-reference.md)
