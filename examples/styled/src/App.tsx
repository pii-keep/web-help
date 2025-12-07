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
        <h1>Styled Example</h1>
        <p>Using @piikeep/web-help with baseline CSS styling</p>
      </header>

      <div className='app-container'>
        <HelpProvider manifestData={manifestData}>
          <HelpPage />
        </HelpProvider>
      </div>
    </>
  );
}

export default App;
