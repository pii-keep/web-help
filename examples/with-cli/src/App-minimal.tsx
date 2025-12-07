import { useEffect, useState } from 'react';
import { HelpProvider, HelpPage } from '@piikeep-pw/web-help';
import { loadFromConfig, type LoadManifestResult } from '../../../src/devtools';
import helpConfig from '../help.config';

// Test HelpPage WITH content manifest
function AppMinimal() {
  const [manifestData, setManifestData] = useState<LoadManifestResult>();

  useEffect(() => {
    async function loadContent() {
      try {
        const result = await loadFromConfig(helpConfig);
        setManifestData(result);
      } catch (err) {
        console.error('Failed to load help content:', err);
      }
    }
    loadContent();
  }, []);

  if (!manifestData) {
    return <div>Loading...</div>;
  }

  return (
    <HelpProvider
      config={helpConfig}
      contentManifest={manifestData.contentManifest}
    >
      <div>
        <h1>Testing HelpPage with Content</h1>
        <HelpPage />
      </div>
    </HelpProvider>
  );
}

export default AppMinimal;
