import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ZunoContextProvider } from '../../src/react/provider/ZunoContextProvider';
import { useCollection } from '../../src/react/hooks/useCollection';
import '@testing-library/jest-dom';

// Mock axios to prevent real network calls
jest.mock('axios');

// Mock the SDK
jest.mock('../../src/core/ZunoSDK');

function TestComponent() {
  const { createERC721 } = useCollection();
  return <div>SDK Loaded: {createERC721 ? 'Yes' : 'No'}</div>;
}

const mockWagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [mock({ accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'] })],
  transports: {
    [mainnet.id]: http(),
  },
});

describe('ZunoContextProvider (Advanced App)', () => {
  it('works with external Wagmi and QueryClient', async () => {
    const queryClient = new QueryClient();

    render(
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ZunoContextProvider
            config={{
              apiKey: 'test-api-key',
              network: 'mainnet',
            }}
            queryClient={queryClient}
          >
            <TestComponent />
          </ZunoContextProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('SDK Loaded: Yes')).toBeInTheDocument();
    });
  });
});
