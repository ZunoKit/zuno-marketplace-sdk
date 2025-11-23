/**
 * useABIs Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useABIs } from '../../../src/react/hooks/useABIs';
import { ZunoContextProvider } from '../../../src/react/provider/ZunoContextProvider';
import React, { ReactNode } from 'react';

// Create wrapper for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ZunoContextProvider config={{ apiKey: 'test-key', network: 'sepolia' }} queryClient={queryClient}>
        {children}
      </ZunoContextProvider>
    </QueryClientProvider>
  );
}

describe('useABIs', () => {
  it('should provide prefetchABIs method', () => {
    const { result } = renderHook(() => useABIs(), {
      wrapper: createWrapper(),
    });

    expect(result.current.prefetchABIs).toBeDefined();
    expect(typeof result.current.prefetchABIs).toBe('function');
  });

  it('should provide clearABICache method', () => {
    const { result } = renderHook(() => useABIs(), {
      wrapper: createWrapper(),
    });

    expect(result.current.clearABICache).toBeDefined();
    expect(typeof result.current.clearABICache).toBe('function');
  });

  it('should handle prefetchABIs call', async () => {
    const { result } = renderHook(() => useABIs(), {
      wrapper: createWrapper(),
    });

    // Should not throw
    await expect(
      result.current.prefetchABIs([
        { contractType: 'ERC721', network: 'sepolia' },
      ])
    ).resolves.not.toThrow();
  });

  it('should handle clearABICache call', () => {
    const { result } = renderHook(() => useABIs(), {
      wrapper: createWrapper(),
    });

    // Should not throw
    expect(() => result.current.clearABICache()).not.toThrow();
  });
});
