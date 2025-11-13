# Phase 1: Core SDK (Weeks 1-2)

## Objectives

Build the foundation của SDK với core classes và ABI fetching system.

## Tasks

- ✅ Setup TypeScript project structure
- ⏳ Implement ZunoSDK main class
- ⏳ Build ZunoAPIClient with axios
- ⏳ Create ContractRegistry with TanStack Query
- ⏳ Implement ExchangeModule
- ⏳ Implement CollectionModule
- ⏳ Write unit tests for core components
- ⏳ Setup error handling & retry logic

## Deliverables

- Core SDK package working
- Basic exchange & collection functionality
- Unit test coverage >80%

---

## Implementation Details

### 1. ZunoSDK Main Class

File: `src/core/ZunoSDK.ts`

```typescript
import { ethers } from 'ethers';
import { QueryClient } from '@tanstack/react-query';
import { ZunoAPIClient } from './ZunoAPIClient';
import { ContractRegistry } from './ContractRegistry';

export interface ZunoSDKConfig {
  // Required
  apiKey: string;
  network: 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number;

  // Optional
  apiUrl?: string;
  rpcUrl?: string;
  walletConnectProjectId?: string;
  cache?: { ttl?: number };
  retryPolicy?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
  };
}

export interface SDKOptions {
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  queryClient?: QueryClient;
}

export class ZunoSDK {
  private apiClient: ZunoAPIClient;
  private contractRegistry: ContractRegistry;
  private queryClient: QueryClient;
  private config: ZunoSDKConfig;
  private provider?: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(config: ZunoSDKConfig, options?: SDKOptions) {
    // Implementation here
  }

  // Feature modules (lazy loaded)
  get exchange(): ExchangeModule { }
  get collection(): CollectionModule { }
  get auction(): AuctionModule { }
  get offers(): OfferModule { }
  get bundles(): BundleModule { }
}
```

### 2. ZunoAPIClient with TanStack Query

File: `src/core/ZunoAPIClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

export class ZunoAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private axios: AxiosInstance;

  async getABI(contractName: string, network: string): Promise<AbiEntity>
  async getABIById(abiId: string): Promise<AbiEntity>
  async getContractInfo(address: string, networkId: string): Promise<ContractEntity>
  async getNetworks(): Promise<NetworkEntity[]>
}

// Query Keys Factory
export const abiQueryKeys = {
  all: ['abis'] as const,
  detail: (contractName: string, network: string) => [...],
  byId: (abiId: string) => [...],
  contracts: (address: string, networkId: string) => [...],
};

// Query Options Factory
export function createABIQueryOptions(
  client: ZunoAPIClient,
  contractName: string,
  network: string
) {
  return {
    queryKey: abiQueryKeys.detail(contractName, network),
    queryFn: () => client.getABI(contractName, network),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  };
}
```

### 3. ContractRegistry with QueryClient

File: `src/core/ContractRegistry.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

export class ContractRegistry {
  private apiClient: ZunoAPIClient;
  private queryClient: QueryClient;

  async getContract(
    contractType: ContractType,
    network: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<ethers.Contract>

  async getABI(contractAddress: string, network: string): Promise<unknown>
  async prefetchABIs(contractTypes: ContractType[], network: string): Promise<void>
  async clearCache(): Promise<void>
}
```

### 4. ExchangeModule

File: `src/modules/ExchangeModule.ts`

```typescript
export class ExchangeModule extends BaseModule {
  async listNFT(params: {
    collectionAddress: string;
    tokenId: string;
    price: string;
    duration: number;
    paymentToken?: string;
  }): Promise<TransactionResponse>

  async buyNFT(listingId: string, value?: string): Promise<TransactionResponse>
  async cancelListing(listingId: string): Promise<TransactionResponse>
  async getListing(listingId: string): Promise<Listing>
  async getListingsByCollection(collectionAddress: string): Promise<PaginatedResult<Listing>>
}
```

### 5. CollectionModule

File: `src/modules/CollectionModule.ts`

```typescript
export class CollectionModule extends BaseModule {
  async createERC721Collection(params: {
    name: string;
    symbol: string;
    baseUri: string;
    maxSupply: number;
  }): Promise<{ address: string; tx: TransactionResponse }>

  async mintERC721(
    collectionAddress: string,
    recipient: string,
    tokenUri: string
  ): Promise<{ tokenId: string; tx: TransactionResponse }>

  async verifyCollection(address: string): Promise<{
    isValid: boolean;
    tokenType: 'ERC721' | 'ERC1155' | 'Unknown';
  }>
}
```

## Testing

```typescript
// tests/unit/core/ZunoSDK.test.ts
describe('ZunoSDK', () => {
  it('should initialize with config', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'sepolia',
    });
    expect(sdk).toBeDefined();
  });
});

// tests/unit/core/ZunoAPIClient.test.ts
describe('ZunoAPIClient', () => {
  it('should fetch ABI from registry', async () => {
    const client = new ZunoAPIClient('test-key');
    const abi = await client.getABI('ERC721NFTExchange', 'sepolia');
    expect(abi).toBeDefined();
  });
});
```

## Success Criteria

- [ ] ZunoSDK class implemented and tested
- [ ] ZunoAPIClient with TanStack Query working
- [ ] ContractRegistry caching ABIs correctly
- [ ] ExchangeModule core functions working
- [ ] CollectionModule core functions working
- [ ] Unit tests passing (>80% coverage)
- [ ] Documentation complete

## Next Phase

After completing Phase 1, move to [Phase 2: Advanced Features](./phase-2-advanced-features.md)
