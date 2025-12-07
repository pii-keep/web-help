import { useEffect, useState, useRef } from 'react';
import { HelpProvider, HelpPage, useHelpContext } from '@piikeep-pw/web-help';
import { loadFromConfig, type LoadManifestResult } from '../../../src/devtools';

import helpConfig from '../help.config';

import { useTheme } from './ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className='theme-toggle'
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

// Component to register categories after provider initializes
function CategoryRegistrar({
  categories,
}: {
  categories: LoadManifestResult['categories'];
}) {
  const { contentLoader } = useHelpContext();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!registeredRef.current && categories.length > 0) {
      categories.forEach((category) => {
        contentLoader.registerCategory(category);
      });
      registeredRef.current = true;
    }
  }, [categories, contentLoader]);

  return null;
}

function App() {
  const [manifestData, setManifestData] = useState<LoadManifestResult>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadContent() {
      try {
        const result = await loadFromConfig(helpConfig);
        setManifestData(result);
      } catch (err) {
        console.error('Failed to load help content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      }
    }
    loadContent();
  }, []);

  if (error) {
    return (
      <div className='error' style={{ padding: '2rem', color: 'red' }}>
        <h1>Error Loading Help Content</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!manifestData) {
    return <div style={{ padding: '2rem' }}>Loading help content...</div>;
  }

  return (
    <HelpProvider
      config={helpConfig}
      contentManifest={manifestData.contentManifest}
    >
      <div className='app'>
        <header className='app-header'>
          <h1>Help Documentation</h1>
          <ThemeToggle />
        </header>
        <main className='app-main'>
          <HelpPage />
        </main>
      </div>
    </HelpProvider>
  );
}

export default App;
