import { HelpProvider, HelpPage } from '@piikeep/web-help';
import { loadFromManifestFile } from '@piikeep/web-help/devtools';
import { useEffect, useState } from 'react';
import type { LoadManifestResult } from '@piikeep/web-help/devtools';

function App() {
  const [manifestData, setManifestData] = useState<LoadManifestResult | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadFromManifestFile({
      manifestPath: '/help/manifest.json',
      articlesPath: '/help',
      extensions: ['md', 'json', 'csv'],
    })
      .then(setManifestData)
      .catch(setError);
  }, []);

  if (error) {
    return (
      <div className='app-container'>
        <div className='help-page-error'>
          <h1>Error loading help content</h1>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!manifestData) {
    return (
      <div className='app-container'>
        <div className='help-page-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className='app-header'>
        <h1>Multi-Format Example</h1>
        <p>Demonstrating Markdown, JSON, and CSV content formats</p>
        <div className='format-badges'>
          <span className='format-badge'>Markdown</span>
          <span className='format-badge'>JSON</span>
          <span className='format-badge'>CSV</span>
        </div>
      </header>

      <div className='app-container'>
        <HelpProvider
          manifestData={manifestData}
          config={{
            fullConfig: {
              content: {
                formats: ['md', 'json', 'csv'],
              },
            },
          }}
        >
          <HelpPage />
        </HelpProvider>
      </div>
    </>
  );
}

export default App;
