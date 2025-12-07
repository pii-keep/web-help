import { HelpProvider } from '../../../src/core/context/HelpProvider';
import { HelpPage } from '../../../src/core/components/HelpPage';
import { loadFromConfig, type LoadManifestResult } from '../../../src/devtools';
import helpConfig from '../help.config';
import { useEffect, useState } from 'react';

function AppTest() {
  const [manifestData, setManifestData] = useState<LoadManifestResult | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadFromConfig(helpConfig)
      .then(setManifestData)
      .catch((err) => {
        console.error('Failed to load manifest:', err);
        setError(err);
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Error loading help system</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!manifestData) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading help system...</p>
      </div>
    );
  }

  return (
    <HelpProvider
      manifestData={manifestData}
      config={{ fullConfig: helpConfig }}
    >
      {/* That's it! HelpPage includes everything by default */}
      <HelpPage showNavigation />
    </HelpProvider>
  );
}

export default AppTest;
