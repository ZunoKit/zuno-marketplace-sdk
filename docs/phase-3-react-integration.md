# Phase 3: React Integration (Weeks 5-6)

## Objectives

Build comprehensive React hooks and provider system with Wagmi integration.

## Tasks

- ⏳ Create ZunoProvider component (with Wagmi & React Query)
- ⏳ Implement all React hooks
  - useExchange, useListings, useListing
  - useCollection
  - useAuction, useAuctionDetails
  - useOffers, useOffer
  - useBundles, useBundle
  - useWallet, useBalance, useApprove
  - useABI, usePrefetchABIs, useABIsCached
- ⏳ Setup TanStack Query integration
- ⏳ Write React hook tests with React Testing Library
- ⏳ Create example Next.js app

## Deliverables

- Complete React package
- All hooks tested
- Working Next.js example

---

## Implementation Details

### 1. ZunoProvider (All-in-One)

File: `src/react/provider/ZunoProvider.tsx`

```typescript
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;
  queryClient?: QueryClient;
  wagmiConfig?: any;
  enableDevTools?: boolean;
}

export function ZunoProvider({
  config,
  children,
  enableDevTools = process.env.NODE_ENV === 'development'
}: ZunoProviderProps) {
  // Auto-create QueryClient
  const [queryClient] = useState(() => new QueryClient({ ... }));

  // Auto-create Wagmi config based on network
  const [wagmiConfig] = useState(() => createConfig({ ... }));

  // Create SDK instance
  const sdk = useMemo(() => new ZunoSDK(config, { queryClient }), [config]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContext.Provider value={{ sdk }}>
          {children}
          {enableDevTools && <ReactQueryDevtools />}
        </ZunoContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2. Exchange Hooks

File: `src/react/hooks/useExchange.ts`

```typescript
export function useExchange() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const listNFT = useMutation({
    mutationFn: (params) => sdk.exchange.listNFT(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  const buyNFT = useMutation({
    mutationFn: ({ listingId, value }) => sdk.exchange.buyNFT(listingId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  return { listNFT, buyNFT, cancelListing };
}

export function useListings(collectionAddress?: string) {
  const sdk = useZuno();
  return useQuery({
    queryKey: ['listings', collectionAddress],
    queryFn: () => sdk.exchange.getListingsByCollection(collectionAddress!),
    enabled: !!collectionAddress,
  });
}
```

### 3. ABI Management Hooks

File: `src/react/hooks/useABIs.ts`

```typescript
export function useABI(contractType: ContractType, network: string) {
  const sdk = useZuno();
  const apiClient = sdk['apiClient'];
  return useQuery(createABIQueryOptions(apiClient, contractType, network));
}

export function usePrefetchABIs() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const prefetch = async (contractTypes: ContractType[], network: string) => {
    await Promise.all(
      contractTypes.map(type =>
        queryClient.prefetchQuery(createABIQueryOptions(sdk['apiClient'], type, network))
      )
    );
  };

  return { prefetch };
}

export function useInitializeABIs() {
  const { prefetch } = usePrefetchABIs();
  const network = 'sepolia';

  useEffect(() => {
    prefetch([
      'ERC721NFTExchange',
      'ERC1155NFTExchange',
      'ERC721CollectionFactory',
      'ERC1155CollectionFactory',
      'EnglishAuction',
      'DutchAuction',
    ], network);
  }, [network]);
}
```

### 4. Wallet Hook

File: `src/react/hooks/useWallet.ts`

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return {
    address,
    chainId,
    isConnected,
    connect: () => connect({ connector: connectors[0] }),
    disconnect,
  };
}
```

## Testing

```typescript
// tests/unit/react/hooks/useExchange.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useExchange } from '@/react/hooks/useExchange';

describe('useExchange', () => {
  it('should list NFT', async () => {
    const { result } = renderHook(() => useExchange(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      result.current.listNFT.mutate({
        collectionAddress: '0x...',
        tokenId: '1',
        price: '1000000000000000000',
        duration: 86400,
      });
    });

    expect(result.current.listNFT.isSuccess).toBe(true);
  });
});
```

## Example App

```tsx
// examples/frontend/nextjs/app/layout.tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

export default function RootLayout({ children }) {
  return (
    <ZunoProvider config={{
      apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
      network: 'sepolia',
    }}>
      {children}
    </ZunoProvider>
  );
}

// examples/frontend/nextjs/app/page.tsx
import { useCollection, useWallet } from 'zuno-marketplace-sdk/react';

export default function Home() {
  const { mintERC721 } = useCollection();
  const { address } = useWallet();

  return (
    <button onClick={() => mintERC721.mutateAsync({
      collectionAddress: '0x...',
      recipient: address,
      tokenUri: 'ipfs://...'
    })}>
      Mint NFT
    </button>
  );
}
```

## Success Criteria

- [ ] ZunoProvider with Wagmi & React Query implemented
- [ ] All core hooks implemented and tested
- [ ] ABI management hooks working
- [ ] Wallet integration working
- [ ] React Testing Library tests passing
- [ ] Next.js example app working
- [ ] Documentation complete

## Next Phases

- Phase 4: Documentation & Examples
- Phase 5: Testing & Optimization
- Phase 6: Release Preparation
