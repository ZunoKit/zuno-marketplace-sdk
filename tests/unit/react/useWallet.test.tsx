/**
 * useWallet Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useWallet } from '../../../src/react/hooks/useWallet';
import React, { ReactNode } from 'react';

// Create test Wagmi config
const testConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('http://localhost:8545'),
  },
});

// Create wrapper for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={testConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

describe('useWallet', () => {
  it('should provide wallet connection methods', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current.connect).toBeDefined();
    expect(result.current.disconnect).toBeDefined();
  });

  it('should provide wallet state', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('address');
    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('isConnecting');
    expect(result.current).toHaveProperty('isDisconnected');
  });

  it('should provide chain information', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('chain');
    expect(result.current).toHaveProperty('chains');
  });

  it('should provide connector information', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('connector');
    expect(result.current).toHaveProperty('connectors');
  });

  it('should initially be disconnected', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
  });

  it('should have undefined address when disconnected', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(),
    });

    expect(result.current.address).toBeUndefined();
  });
});
