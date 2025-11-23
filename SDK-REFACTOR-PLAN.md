# Zuno SDK Refactor Plan - Flexible Provider Architecture

## 🎯 Objective
Make ZunoProvider work with both:
- ✅ **Simple apps** - No Wagmi setup (all-in-one)
- ✅ **Advanced apps** - Has Wagmi + RainbowKit already

## ❌ Current Problem

```typescript
// Current ZunoProvider always creates its own Wagmi + React Query
export function ZunoProvider({ config, children }) {
  return (
    <WagmiProvider config={wagmiConfig}>          // ← Always creates
      <QueryClientProvider client={queryClient}>  // ← Always creates
        <ZunoContext.Provider>...</ZunoContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Issues:**
- Can't use with existing Wagmi setup
- Conflicts with RainbowKit
- No flexibility for advanced use cases

---

## ✅ Solution: Layered Provider Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ Layer 1: ZunoContextProvider (Core)            │
│ - Only provides SDK context                     │
│ - No Wagmi, no React Query                      │
│ - Can be used standalone                        │
└─────────────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────────────┐
│ Layer 2: ZunoProvider (All-in-One)             │
│ - Includes Wagmi + React Query                  │
│ - Uses ZunoContextProvider internally           │
│ - For simple apps                                │
└─────────────────────────────────────────────────┘
```

---

## 📝 Implementation Plan

### Phase 1: Create Core Provider

#### File: `src/react/provider/ZunoContextProvider.tsx` (NEW)

```typescript
/**
 * Core Zuno Context Provider
 * Provides SDK instance without Wagmi/React Query wrappers
 */

'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ZunoSDK } from '../../core/ZunoSDK';
import type { ZunoSDKConfig } from '../../types/config';
import { QueryClient } from '@tanstack/react-query';

export interface ZunoContextValue {
  sdk: ZunoSDK;
}

const ZunoContext = createContext<ZunoContextValue | null>(null);

export interface ZunoContextProviderProps {
  config: ZunoSDKConfig;
  queryClient?: QueryClient; // Optional external QueryClient
  children: ReactNode;
}

/**
 * Core Context Provider - No Wagmi/React Query wrappers
 * Use this when you already have Wagmi + React Query setup
 */
export function ZunoContextProvider({
  config,
  queryClient,
  children
}: ZunoContextProviderProps) {
  // Create SDK instance
  const sdk = useMemo(
    () => new ZunoSDK(config, queryClient ? { queryClient } : undefined),
    [config, queryClient]
  );

  const contextValue = useMemo<ZunoContextValue>(
    () => ({ sdk }),
    [sdk]
  );

  return (
    <ZunoContext.Provider value={contextValue}>
      {children}
    </ZunoContext.Provider>
  );
}

/**
 * Hook to access Zuno SDK
 */
export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    throw new Error('useZuno must be used within ZunoContextProvider or ZunoProvider');
  }

  return context.sdk;
}
```

---

### Phase 2: Refactor ZunoProvider

#### File: `src/react/provider/ZunoProvider.tsx` (MODIFY)

```typescript
/**
 * All-in-One Zuno Provider with Wagmi & React Query built-in
 * Use this for simple apps without existing Wagmi setup
 */

'use client';

import React, { useState, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ZunoContextProvider } from './ZunoContextProvider';
import type { ZunoSDKConfig } from '../../types/config';

export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;
  enableDevTools?: boolean;
}

/**
 * Get chain config from network
 */
function getChainFromNetwork(network: ZunoSDKConfig['network']) {
  switch (network) {
    case 'mainnet':
      return mainnet;
    case 'sepolia':
      return sepolia;
    case 'polygon':
      return polygon;
    case 'arbitrum':
      return arbitrum;
    case 'anvil':
      // For local development
      return {
        id: 31337,
        name: 'Anvil',
        network: 'anvil',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['http://127.0.0.1:8545'] },
          public: { http: ['http://127.0.0.1:8545'] },
        },
      } as any;
    default:
      return sepolia;
  }
}

/**
 * All-in-One Zuno Provider
 * Includes Wagmi + React Query + Zuno SDK
 *
 * Use this when you DON'T have Wagmi setup yet.
 * For apps with existing Wagmi, use ZunoContextProvider instead.
 */
export function ZunoProvider({
  config,
  children,
  enableDevTools = process.env.NODE_ENV === 'development',
}: ZunoProviderProps) {
  // Create QueryClient with caching config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: config.cache?.ttl || 5 * 60 * 1000,
            gcTime: config.cache?.gcTime || 10 * 60 * 1000,
            retry: config.retryPolicy?.maxRetries || 3,
            retryDelay: (attemptIndex) => {
              const delay = config.retryPolicy?.initialDelay || 1000;
              return config.retryPolicy?.backoff === 'exponential'
                ? Math.min(delay * 2 ** attemptIndex, 30000)
                : delay * (attemptIndex + 1);
            },
          },
        },
      })
  );

  // Create Wagmi config
  const [wagmiConfig] = useState(() => {
    const chain = getChainFromNetwork(config.network);

    const connectors = [
      injected(),
      coinbaseWallet({ appName: 'Zuno Marketplace' }),
    ];

    if (config.walletConnectProjectId) {
      connectors.push(
        walletConnect({
          projectId: config.walletConnectProjectId,
          showQrModal: true,
        }) as any
      );
    }

    return createConfig({
      chains: [chain],
      connectors,
      transports: {
        [chain.id]: http(config.rpcUrl),
      } as any,
    });
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContextProvider config={config} queryClient={queryClient}>
          {children}
          {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
        </ZunoContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Re-export useZuno for convenience
export { useZuno } from './ZunoContextProvider';
```

---

### Phase 3: Update Exports

#### File: `src/react/index.ts` (MODIFY)

```typescript
/**
 * React Integration for Zuno SDK
 */

// Providers
export { ZunoProvider } from './provider/ZunoProvider';
export { ZunoContextProvider } from './provider/ZunoContextProvider';
export { useZuno } from './provider/ZunoContextProvider';

// Hooks
export { useCollection } from './hooks/useCollection';
export { useExchange } from './hooks/useExchange';
export { useAuction } from './hooks/useAuction';
export { useOffer } from './hooks/useOffer';
export { useBundle } from './hooks/useBundle';
export { useWallet } from './hooks/useWallet';

// Types
export type { ZunoContextValue } from './provider/ZunoContextProvider';
export type { ZunoProviderProps } from './provider/ZunoProvider';
```

---

### Phase 4: Update Hooks to Use Context

#### File: `src/react/hooks/useCollection.ts` (MODIFY)

```typescript
/**
 * Collection hooks using Zuno SDK
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoContextProvider';
import type { CreateERC721Params, CreateERC1155Params } from '../../types';

export function useCollection() {
  const sdk = useZuno();

  // Create ERC721 Collection
  const createERC721Collection = useMutation({
    mutationFn: async (params: CreateERC721Params) => {
      return await sdk.collection.createERC721Collection(params);
    },
  });

  // Create ERC1155 Collection
  const createERC1155Collection = useMutation({
    mutationFn: async (params: CreateERC1155Params) => {
      return await sdk.collection.createERC1155Collection(params);
    },
  });

  return {
    createERC721Collection,
    createERC1155Collection,
  };
}
```

---

## 📚 Usage Examples

### Example 1: Simple App (No Wagmi)

```typescript
// app/layout.tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ZunoProvider
          config={{
            apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
            network: 'sepolia',
          }}
        >
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';
import { useCollection } from 'zuno-marketplace-sdk/react';

export default function HomePage() {
  const { createERC721Collection } = useCollection();

  const handleCreate = async () => {
    await createERC721Collection.mutateAsync({
      name: 'My Collection',
      symbol: 'MC',
      baseUri: 'https://...',
      maxSupply: 10000,
    });
  };

  return <button onClick={handleCreate}>Create Collection</button>;
}
```

---

### Example 2: Advanced App (With Wagmi + RainbowKit)

```typescript
// app/providers.tsx
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ZunoContextProvider } from 'zuno-marketplace-sdk/react';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ZunoContextProvider
            config={{
              apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
              network: 'anvil',
            }}
            queryClient={queryClient}  // ← Pass existing QueryClient
          >
            {children}
          </ZunoContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// app/page.tsx - Same usage!
'use client';
import { useCollection } from 'zuno-marketplace-sdk/react';

export default function HomePage() {
  const { createERC721Collection } = useCollection();
  // Works the same way!
}
```

---

## 🧪 Testing Plan

### Test Cases

#### 1. Simple App Test
```typescript
// tests/simple-app.test.tsx
import { render, screen } from '@testing-library/react';
import { ZunoProvider, useCollection } from '../src/react';

function TestComponent() {
  const { createERC721Collection } = useCollection();
  return <div>SDK Loaded: {createERC721Collection ? 'Yes' : 'No'}</div>;
}

test('ZunoProvider works standalone', () => {
  render(
    <ZunoProvider config={{ apiKey: 'test', network: 'sepolia' }}>
      <TestComponent />
    </ZunoProvider>
  );

  expect(screen.getByText('SDK Loaded: Yes')).toBeInTheDocument();
});
```

#### 2. Advanced App Test
```typescript
// tests/advanced-app.test.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ZunoContextProvider, useCollection } from '../src/react';

test('ZunoContextProvider works with external Wagmi', () => {
  const queryClient = new QueryClient();

  render(
    <WagmiProvider config={mockWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContextProvider
          config={{ apiKey: 'test', network: 'anvil' }}
          queryClient={queryClient}
        >
          <TestComponent />
        </ZunoContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );

  expect(screen.getByText('SDK Loaded: Yes')).toBeInTheDocument();
});
```

---

## 📋 Implementation Checklist

### Phase 1: Core Provider
- [ ] Create `ZunoContextProvider.tsx`
- [ ] Implement `useZuno` hook
- [ ] Add proper TypeScript types
- [ ] Write unit tests

### Phase 2: Refactor ZunoProvider
- [ ] Update `ZunoProvider.tsx` to use `ZunoContextProvider`
- [ ] Add support for 'anvil' network
- [ ] Ensure backward compatibility
- [ ] Update tests

### Phase 3: Update Exports
- [ ] Export `ZunoContextProvider` in `react/index.ts`
- [ ] Update package.json exports
- [ ] Update TypeScript declarations

### Phase 4: Documentation
- [ ] Update README.md with both usage examples
- [ ] Add migration guide for existing users
- [ ] Create API documentation
- [ ] Add JSDoc comments

### Phase 5: Testing
- [ ] Write unit tests for ZunoContextProvider
- [ ] Write integration tests for both patterns
- [ ] Test with actual Wagmi + RainbowKit
- [ ] Test backward compatibility

---

## 🚀 Migration Guide for Existing Users

### No Changes Needed!

Existing code using `ZunoProvider` will continue to work:

```typescript
// ✅ Still works!
<ZunoProvider config={...}>
  <App />
</ZunoProvider>
```

### New Advanced Usage

For apps with existing Wagmi:

```typescript
// ✅ New option!
<WagmiProvider>
  <QueryClientProvider>
    <RainbowKitProvider>
      <ZunoContextProvider config={...} queryClient={...}>
        <App />
      </ZunoContextProvider>
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

---

## 📊 Benefits

✅ **Backward Compatible** - Existing code works without changes
✅ **Flexible** - Supports both simple and advanced use cases
✅ **Clear Separation** - Core context vs. all-in-one wrapper
✅ **No Conflicts** - Works perfectly with RainbowKit
✅ **Better DX** - Developers choose what they need

---

## 🎯 Timeline

- **Phase 1**: 2-3 hours (Core provider)
- **Phase 2**: 2-3 hours (Refactor ZunoProvider)
- **Phase 3**: 1 hour (Exports)
- **Phase 4**: 2-3 hours (Documentation)
- **Phase 5**: 3-4 hours (Testing)

**Total**: ~1-2 days

---

## 🔍 Questions to Resolve

1. Should we deprecate anything in v2.0.0?
2. Do we need a migration tool/script?
3. Should we add more examples to the repo?
4. Do we want to support other wallet libraries (Privy, etc.)?

---

**Ready to implement? Let me know if you want me to start with Phase 1!** 🚀
