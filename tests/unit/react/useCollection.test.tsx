/**
 * useCollection Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollection } from '../../../src/react/hooks/useCollection';
import { ZunoContextProvider } from '../../../src/react/provider/ZunoContextProvider';
import React, { ReactNode } from 'react';

// Create wrapper for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('useCollection', () => {
  it('should provide collection operations', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createERC721).toBeDefined();
    expect(result.current.createERC1155).toBeDefined();
    expect(result.current.mintERC721).toBeDefined();
    expect(result.current.mintERC1155).toBeDefined();
  });

  it('should have correct mutation status initially', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createERC721.isPending).toBe(false);
    expect(result.current.createERC721.isSuccess).toBe(false);
    expect(result.current.createERC721.isError).toBe(false);
  });

  it('should expose mutation methods for ERC721', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createERC721.mutate).toBe('function');
    expect(typeof result.current.createERC721.mutateAsync).toBe('function');
    expect(typeof result.current.createERC721.reset).toBe('function');
  });

  it('should expose mutation methods for ERC1155', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createERC1155.mutate).toBe('function');
    expect(typeof result.current.createERC1155.mutateAsync).toBe('function');
  });

  it('should handle mint mutations', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mintERC721).toBeDefined();
    expect(result.current.mintERC721.isPending).toBe(false);

    expect(result.current.mintERC1155).toBeDefined();
    expect(typeof result.current.mintERC1155.mutate).toBe('function');
  });

  it('should provide all necessary mutation operations', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper(),
    });

    const operations = [
      'createERC721',
      'createERC1155',
      'mintERC721',
      'mintERC1155',
    ];

    operations.forEach((op) => {
      expect(result.current).toHaveProperty(op);
      expect(result.current[op as keyof typeof result.current]).toBeDefined();
    });
  });
});
