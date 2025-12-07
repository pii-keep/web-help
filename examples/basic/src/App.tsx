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
      extensions: ['md'],
    })
      .then(setManifestData)
      .catch(setError);
  }, []);

  if (error) {
    return (
      <div className='container'>
        <div className='help-page-error'>
          <h1>Error loading help content</h1>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!manifestData) {
    return (
      <div className='container'>
        <div className='help-page-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='container'>
      <header className='header'>
        <h1>Basic Example</h1>
        <p>A simple example of @piikeep/web-help with minimal styling</p>
      </header>

      <HelpProvider manifestData={manifestData}>
        <HelpPage />
      </HelpProvider>
    </div>
  );
}

export default App;
