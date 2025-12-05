#!/usr/bin/env node

import { program } from 'commander';
import {
  generateInitFiles,
  generateArticle,
  getArticleTemplates,
} from '../dist/web-help-library.es.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load help.config.ts/js if it exists
 */
async function loadHelpConfig() {
  const configPaths = ['help.config.ts', 'help.config.js', 'help.config.mjs'];

  for (const configPath of configPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);
    if (fs.existsSync(fullPath)) {
      try {
        // For .ts files, we need to use a TypeScript loader or skip
        // For now, we'll only support .js/.mjs for dynamic loading
        if (configPath.endsWith('.ts')) {
          // Read and parse manually for basic cases
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Extract basePath using regex (simple approach)
          const basePathMatch = content.match(/basePath:\s*['"]([^'"]+)['"]/);
          const prefixMatch = content.match(/prefix:\s*['"]([^'"]+)['"]/);

          if (basePathMatch || prefixMatch) {
            return {
              content: {
                basePath: basePathMatch ? basePathMatch[1] : './public/help',
              },
              storage: {
                prefix: prefixMatch ? prefixMatch[1] : '',
              },
            };
          }
        } else {
          // Dynamic import for .js/.mjs
          const configUrl = pathToFileURL(fullPath).href;
          const config = await import(configUrl);
          return config.default || config;
        }
      } catch (error) {
        console.warn(`⚠️  Could not load ${configPath}:`, error.message);
      }
    }
  }

  return null;
}

program
  .name('web-help')
  .description('CLI tools for @piikeep/web-help')
  .version('0.2.2');

program
  .command('init')
  .description('Initialize help system in your project')
  .option('-o, --output <dir>', 'Output directory', './public/help')
  .option('-f, --format <format>', 'Content format (md|mdx)', 'md')
  .action(async (options) => {
    try {
      console.log('🚀 Initializing help system...');

      const outputDir = path.resolve(process.cwd(), options.output);

      const result = generateInitFiles({
        contentDir: outputDir,
        formats: [options.format],
        includeExamples: true,
        typescript: true,
      });

      // Create all files
      let filesCreated = 0;
      for (const file of result.files) {
        const filePath = path.resolve(process.cwd(), file.path);
        const fileDir = path.dirname(filePath);

        // Ensure directory exists
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(filePath, file.content, 'utf-8');
        filesCreated++;
      }

      console.log(`✅ Help system initialized at ${options.output}`);
      console.log(`📝 Created ${filesCreated} files:`);
      result.files.forEach((file) => {
        console.log(`   - ${file.path}`);
      });

      console.log('\n💡 Next steps:');
      console.log('   1. Review help.config.ts configuration');
      console.log('   2. Edit example articles in the output directory');
      console.log(
        '   3. Add more articles using: web-help add "Article Title"',
      );
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('add <title>')
  .description('Add a new help article')
  .option(
    '-t, --template <name>',
    'Template to use (basic|tutorial|reference|troubleshooting)',
    'basic',
  )
  .option('-c, --category <id>', 'Category ID', 'guides')
  .option('-o, --output <dir>', 'Output directory (overrides config)')
  .option(
    '-f, --format <format>',
    'Content format (markdown|mdx|json)',
    'markdown',
  )
  .action(async (title, options) => {
    try {
      console.log(`📝 Creating article: ${title}...`);

      // Load config to get defaults
      const config = await loadHelpConfig();

      // Determine output directory
      let outputDir;
      if (options.output) {
        outputDir = path.resolve(process.cwd(), options.output);
      } else if (config?.content?.basePath) {
        outputDir = path.resolve(process.cwd(), config.content.basePath);
        console.log(
          `📂 Using basePath from config: ${config.content.basePath}`,
        );
      } else {
        outputDir = path.resolve(process.cwd(), './public/help');
        console.log('📂 Using default output: ./public/help');
      }

      // Get prefix from config
      const prefix = config?.storage?.prefix || '';

      const result = generateArticle({
        title,
        template: options.template,
        outputDir,
        category: options.category,
      });

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Apply prefix to filename if configured
      let finalPath = result.path;
      if (prefix) {
        const fileName = path.basename(result.path);
        const dir = path.dirname(result.path);
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);

        // Only add prefix if not already present
        if (!baseName.startsWith(prefix)) {
          const prefixedName = `${prefix}${baseName}${ext}`;
          finalPath = path.join(dir, prefixedName);
          console.log(`📝 Applying prefix "${prefix}" to filename`);
        }
      }

      // Write the file
      fs.writeFileSync(finalPath, result.content, 'utf-8');

      // Extract slug from path (without prefix for manifest)
      const fileName = path.basename(finalPath, path.extname(finalPath));
      const slug =
        prefix && fileName.startsWith(prefix)
          ? fileName.substring(prefix.length)
          : fileName;

      console.log(`✅ Article created: ${finalPath}`);

      // Update manifest.json
      await updateManifest(outputDir, {
        title,
        category: options.category,
        slug,
      });

      console.log(`\n💡 Next steps:`);
      console.log(`   1. Edit the article at ${finalPath}`);
      console.log(`   2. Update frontmatter (category, tags, etc.)`);
      console.log(`   3. Add content to the article body`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available article templates')
  .action(() => {
    const templates = getArticleTemplates();
    console.log('\n📚 Available Templates:\n');
    templates.forEach((template) => {
      console.log(`  ${template.name.padEnd(20)} - ${template.description}`);
    });
    console.log('\nUsage: web-help add "Title" --template <template-name>\n');
  });

/**
 * Update manifest.json with new article
 */
async function updateManifest(outputDir, article) {
  const manifestPath = path.join(outputDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️  manifest.json not found, skipping manifest update');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Ensure categories array exists
  if (!manifest.categories) {
    manifest.categories = [];
  }

  // Find or create category
  let categoryObj = manifest.categories.find(
    (cat) => cat.id === article.category,
  );

  if (!categoryObj) {
    // Create new category
    categoryObj = {
      id: article.category,
      title: article.category
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      order: manifest.categories.length + 1,
      articles: [],
    };
    manifest.categories.push(categoryObj);
  }

  // Ensure articles array exists
  if (!categoryObj.articles) {
    categoryObj.articles = [];
  }

  // Add article if not already present
  const articleExists = categoryObj.articles.some(
    (art) => art.slug === article.slug,
  );

  if (!articleExists) {
    categoryObj.articles.push({
      slug: article.slug,
      title: article.title,
      order: categoryObj.articles.length + 1,
    });

    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`✅ Updated manifest.json with new article`);
  }
}

program.parse();
