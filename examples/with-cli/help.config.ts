import type { HelpConfig } from '@piikeep/web-help';

const helpConfig: HelpConfig = {
  content: {
    source: 'static',
    path: '/public/help',
    formats: ['md', 'mdx'],
  },
  storage: {
    type: 'localStorage',
    prefix: 'help_',
  },
  search: {
    type: 'client',
    options: {
      threshold: 0.3,
      keys: ['title', 'content', 'tags', 'description'],
    },
  },
  navigation: {
    toc: true,
    breadcrumbs: true,
    pagination: true,
  },
};

export default helpConfig;
