/**
 * useAuction Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuction } from '../../../src/react/hooks/useAuction';
import { ZunoContextProvider } from '../../../src/react/provider/ZunoContextProvider';
import { ZunoSDK } from '../../../src/core/ZunoSDK';
import React, { ReactNode } from 'react';

// Create wrapper for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const sdk = new ZunoSDK({
    apiKey: 'test-key',
    network: 'sepolia',
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ZunoContextProvider config={{ apiKey: 'test-key', network: 'sepolia' }} queryClient={queryClient}>
        {children}
      </ZunoContextProvider>
    </QueryClientProvider>
  );
}

describe('useAuction', () => {
  it('should provide auction operations', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createEnglishAuction).toBeDefined();
    expect(result.current.createDutchAuction).toBeDefined();
    expect(result.current.placeBid).toBeDefined();
    expect(result.current.cancelAuction).toBeDefined();
    expect(result.current.settleAuction).toBeDefined();
  });

  it('should have correct mutation status initially', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createEnglishAuction.isPending).toBe(false);
    expect(result.current.createEnglishAuction.isSuccess).toBe(false);
    expect(result.current.createEnglishAuction.isError).toBe(false);
  });

  it('should expose mutation methods', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createEnglishAuction.mutate).toBe('function');
    expect(typeof result.current.createEnglishAuction.mutateAsync).toBe('function');
    expect(typeof result.current.createEnglishAuction.reset).toBe('function');
  });

  it('should handle Dutch auction mutations', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createDutchAuction).toBeDefined();
    expect(result.current.createDutchAuction.isPending).toBe(false);
  });

  it('should handle bid mutations', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.placeBid).toBeDefined();
    expect(result.current.placeBid.isIdle).toBe(true);
  });

  it('should handle cancel auction mutations', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.cancelAuction).toBeDefined();
    expect(typeof result.current.cancelAuction.mutate).toBe('function');
  });

  it('should handle settle auction mutations', () => {
    const { result } = renderHook(() => useAuction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.settleAuction).toBeDefined();
    expect(typeof result.current.settleAuction.mutateAsync).toBe('function');
  });
});
