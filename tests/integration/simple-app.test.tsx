import { render, screen, waitFor } from '@testing-library/react';
import { ZunoProvider } from '../../src/react/provider/ZunoProvider';
import { useCollection } from '../../src/react/hooks/useCollection';
import '@testing-library/jest-dom';

// Mock the SDK to avoid actual network calls
jest.mock('../../src/core/ZunoSDK');

function TestComponent() {
  const { createERC721 } = useCollection();
  return <div>SDK Loaded: {createERC721 ? 'Yes' : 'No'}</div>;
}

describe('ZunoProvider (Simple App)', () => {
  it('works standalone without external Wagmi/QueryClient', async () => {
    render(
      <ZunoProvider
        config={{
          apiKey: 'test-api-key',
          network: 'sepolia',
        }}
      >
        <TestComponent />
      </ZunoProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('SDK Loaded: Yes')).toBeInTheDocument();
    });
  });
});
