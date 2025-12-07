# @piikeep/web-help Examples

This directory contains example projects demonstrating different use cases of the @piikeep/web-help library.

## Available Examples

### 1. Basic Example (`/basic`)

A minimal example showing the core functionality with simple custom styling.

**Features:**

- Basic HelpProvider setup
- Custom CSS styling
- Markdown content
- Navigation and breadcrumbs

**Run:**

```bash
cd examples/basic
npm install
npm run dev
```

### 2. Styled Example (`/styled`)

Demonstrates the baseline CSS styling that comes with the library.

**Features:**

- HelpProvider with baseline.css
- Professional default styling
- Responsive design
- Custom theme variables

**Run:**

```bash
cd examples/styled
npm install
npm run dev
```

### 3. Multi-Format Example (`/multi-format`)

Shows how to use multiple content formats (Markdown, JSON, CSV) in a single help system.

**Features:**

- Multiple format support (MD, JSON, CSV)
- Format auto-detection
- Mixed content sources
- Baseline CSS styling

**Run:**

```bash
cd examples/multi-format
npm install
npm run dev
```

### 4. With CLI Example (`/with-cli`)

Advanced example using the CLI tools for content management.

**Features:**

- CLI integration
- Content generation
- Bulk operations
- Advanced configuration

**Run:**

```bash
cd examples/with-cli
npm install
npm run dev
```

### 5. Editor Example (`/editor`)

Demonstrates the content editor component for creating and editing help articles.

**Features:**

- HelpEditor component
- Live preview
- Metadata editing
- Save/publish workflow

**Run:**

```bash
cd examples/editor
npm install
npm run dev
```

## General Setup

All examples follow a similar structure:

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Creating Your Own Example

To create a new example based on these:

1. Copy one of the existing examples
2. Modify the content in `/public/help`
3. Customize the styling in `src/index.css`
4. Update the App.tsx component as needed

## Documentation

For full documentation, visit the [main README](../README.md).

## Support

If you encounter issues with any example, please [open an issue](https://github.com/pii-keep/web-help/issues).
