
# Zuno Marketplace SDK - Complete Development Plan

**✨ All-in-One NFT Marketplace SDK với Wagmi & React Query đóng gói sẵn!**

## 🚀 Quick Start (30 giây)

```bash
# 1. Install (chỉ 1 package)
npm install zuno-marketplace-sdk
```

```tsx
// 2. Setup (chỉ 1 provider)
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

export default function App({ children }) {
  return (
    <ZunoProvider config={{
      apiKey: 'your-api-key',
      network: 'sepolia',
    }}>
      {children}
    </ZunoProvider>
  );
}
```

```tsx
// 3. Use (hooks ready)
import { useCollection, useWallet } from 'zuno-marketplace-sdk/react';

function CreateNFT() {
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

**Xong! Không cần config Wagmi, React Query, hay bất cứ thứ gì khác! 🎉**

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Module System](#module-system)
5. [React Hooks](#react-hooks)
6. [Usage Examples](#usage-examples)
7. [Project Structure](#project-structure)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Testing Strategy](#testing-strategy)

---

## 🎯 Project Overview

### Goal
Build a TypeScript SDK that simplifies interaction with Zuno Marketplace smart contracts by:
- Fetching ABIs dynamically from `zuno-marketplace-abis` registry
- Providing type-safe contract interactions
- Offering React hooks for frontend integration
- Supporting both frontend and backend usage

### Key Features
- ✅ **Dynamic ABI Fetching** - Load ABIs from registry API on-demand
- ✅ **TanStack Query Integration** - Smart caching, deduplication, and automatic refetching
- ✅ **Modular Architecture** - Exchange, Collection, Auction, Offers, Bundles modules
- ✅ **React Hooks** - Comprehensive hooks for all features + ABI management
- ✅ **TypeScript First** - Full type safety with IntelliSense support
- ✅ **Error Handling** - Automatic retry logic with exponential backoff
- ✅ **Multi-network Support** - Switch networks dynamically
- ✅ **Event Listening** - Subscribe to contract events
- ✅ **Performance Optimized** - Request deduplication, background refetching

### 🚀 Why TanStack Query for ABI Fetching?

We use TanStack Query instead of manual caching because it provides:

**1. Automatic Cache Management**
- No need to manually manage cache TTL and invalidation
- Configurable stale time and garbage collection
- Automatic cache updates on network changes

**2. Request Deduplication**
- Multiple components requesting same ABI? Only 1 API call is made
- Prevents unnecessary network requests
- Improves performance significantly

**3. Background Refetching**
- Automatically refetches stale data in the background
- Users always see fresh data without loading states
- Configurable refetch intervals

**4. Loading & Error States**
- Built-in loading, error, and success states
- No need to manually track request status
- Perfect for UI feedback

**5. Optimistic Updates**
- Update UI immediately, sync with server later
- Better user experience
- Automatic rollback on errors

**6. Developer Experience**
- React Query DevTools for debugging
- Detailed query inspection
- Time-travel debugging

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│  (Next.js, React, Vue, etc.)                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Zuno Marketplace SDK (This Repo)                │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React Hooks Layer                                  │     │
│  │  (useExchange, useCollection, useAuction, etc.)    │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Core SDK                                           │     │
│  │  - ZunoSDK (Main class)                            │     │
│  │  - Module System (Exchange, Collection, etc.)      │     │
│  │  - ContractRegistry (ABI caching)                  │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ZunoAPIClient                                      │     │
│  │  (Axios-based client for ABI registry)             │     │
│  └───────────────────┬────────────────────────────────┘     │
└────────────────────┬─┴──────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌────────────────────┐   ┌────────────────────────┐
│ zuno-marketplace-  │   │ zuno-marketplace-      │
│ abis (API Server)  │   │ contracts (Blockchain) │
│                    │   │                        │
│ - ABIs             │   │ - Smart Contracts      │
│ - Contract Info    │   │ - UserHub/AdminHub     │
│ - Network Info     │   │ - Exchange/Auction     │
└────────────────────┘   └────────────────────────┘
```

---

## 🔧 Core Components

### 1. ZunoSDK - Main SDK Class

```typescript
// ============ Core SDK ============
import { ethers } from 'ethers';

export interface ZunoSDKConfig {
  // ============ Required ============

  // ABI Registry Connection
  apiKey: string;  // Get from zuno-marketplace-abis admin panel

  // Network Configuration
  network: 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number; // ChainId

  // ============ Optional - API ============

  apiUrl?: string; // Default: https://api.zuno.com

  // ============ Optional - Blockchain ============

  // RPC URL for the selected network
  rpcUrl?: string; // Default: Public RPC for the network

  // Direct provider/signer (for backend usage)
  provider?: ethers.Provider;
  signer?: ethers.Signer;

  // ============ Optional - Wallet Integration ============

  // WalletConnect Project ID (get from https://cloud.walletconnect.com)
  walletConnectProjectId?: string; // Required if using WalletConnect

  // ============ Optional - Caching ============

  cache?: {
    ttl?: number; // milliseconds (default: 300000 = 5 min)
  };

  // ============ Optional - Retry Policy ============

  retryPolicy?: {
    maxRetries?: number; // default: 3
    backoff?: 'linear' | 'exponential'; // default: 'exponential'
  };

  timeout?: number; // Request timeout in ms (default: 10000)
}

export interface SDKOptions {
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  queryClient?: QueryClient; // Optional: Share QueryClient with React app
}

export class ZunoSDK {
  private apiClient: ZunoAPIClient;
  private contractRegistry: ContractRegistry;
  private queryClient: QueryClient;
  private config: ZunoSDKConfig;
  private provider?: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(config: ZunoSDKConfig, options?: SDKOptions) {
    this.config = config;

    // Create API client
    this.apiClient = new ZunoAPIClient(
      config.apiKey,
      config.apiUrl || 'https://api.zuno.com'
    );

    // Create or use existing QueryClient
    this.queryClient = options?.queryClient || new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config.cache?.ttl || 300000, // 5 minutes default
          gcTime: (config.cache?.ttl || 300000) * 2, // 10 minutes default
          retry: config.retryPolicy?.maxRetries || 3,
          retryDelay: (attemptIndex: number) => {
            if (config.retryPolicy?.backoff === 'linear') {
              return 1000 * (attemptIndex + 1);
            }
            // Exponential backoff
            return Math.min(1000 * 2 ** attemptIndex, 30000);
          },
        },
      },
    });

    // Create contract registry with QueryClient
    this.contractRegistry = new ContractRegistry(this.apiClient, this.queryClient);

    this.provider = options?.provider;
    this.signer = options?.signer;
  }

  // Expose QueryClient for advanced usage
  getQueryClient(): QueryClient {
    return this.queryClient;
  }

  // Feature modules (lazy loaded)
  private _exchange?: ExchangeModule;
  get exchange(): ExchangeModule {
    if (!this._exchange) {
      this._exchange = new ExchangeModule(this);
    }
    return this._exchange;
  }

  private _collection?: CollectionModule;
  get collection(): CollectionModule {
    if (!this._collection) {
      this._collection = new CollectionModule(this);
    }
    return this._collection;
  }

  private _auction?: AuctionModule;
  get auction(): AuctionModule {
    if (!this._auction) {
      this._auction = new AuctionModule(this);
    }
    return this._auction;
  }

  private _offers?: OfferModule;
  get offers(): OfferModule {
    if (!this._offers) {
      this._offers = new OfferModule(this);
    }
    return this._offers;
  }

  private _bundles?: BundleModule;
  get bundles(): BundleModule {
    if (!this._bundles) {
      this._bundles = new BundleModule(this);
    }
    return this._bundles;
  }

  // Utility methods
  async switchNetwork(network: string | number): Promise<void> {
    this.config.network = network;
    await this.contractRegistry.clearCache();
  }

  getProvider(): ethers.Provider | undefined {
    return this.provider;
  }

  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
  }
}
```

### 2. ZunoAPIClient - ABI Registry Integration

**✨ Using TanStack Query for Better Data Management**

We'll use TanStack Query (React Query) for ABI fetching because it provides:
- ✅ Built-in caching with automatic invalidation
- ✅ Request deduplication (multiple components requesting same ABI)
- ✅ Automatic background refetching
- ✅ Loading/error states out of the box
- ✅ Optimistic updates
- ✅ Perfect integration with React

```typescript
// ============ API Client for zuno-marketplace-abis ============
import axios, { AxiosInstance } from 'axios';

/**
 * Low-level API client for direct HTTP requests
 * Used internally by TanStack Query hooks
 */
export class ZunoAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private axios: AxiosInstance;

  constructor(apiKey: string, baseUrl = 'https://api.zuno.com') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
    });
  }

  // GET /api/abis?contractName=ERC721NFTExchange&network=sepolia
  async getABI(contractName: string, network: string): Promise<AbiEntity> {
    const response = await this.axios.get('/api/abis', {
      params: { contractName, network }
    });
    return response.data;
  }

  // GET /api/abis/{abiId}
  async getABIById(abiId: string): Promise<AbiEntity> {
    const response = await this.axios.get(`/api/abis/${abiId}`);
    return response.data;
  }

  // GET /api/abis/full - Get all ABIs with full data
  async getAllABIs(params?: {
    page?: number;
    limit?: number;
    network?: string;
  }): Promise<PaginatedAbiResponseDto> {
    const response = await this.axios.get('/api/abis/full', { params });
    return response.data;
  }

  // GET /api/contracts/0x...?networkId=11155111
  async getContractInfo(address: string, networkId: string): Promise<ContractEntity> {
    const response = await this.axios.get(`/api/contracts/${address}`, {
      params: { networkId }
    });
    return response.data;
  }

  // GET /api/networks
  async getNetworks(): Promise<NetworkEntity[]> {
    const response = await this.axios.get('/api/networks');
    return response.data;
  }

  // GET /api/networks/{chainId}
  async getNetwork(chainId: number): Promise<NetworkEntity> {
    const response = await this.axios.get(`/api/networks/${chainId}`);
    return response.data;
  }

  // POST /api/contracts - Register a new contract
  async registerContract(data: {
    address: string;
    networkId: string;
    abiId: string;
    name?: string;
    verified?: boolean;
  }): Promise<ContractEntity> {
    const response = await this.axios.post('/api/contracts', data);
    return response.data;
  }
}

/**
 * TanStack Query configuration for ABI fetching
 * Provides caching, deduplication, and automatic refetching
 */
export const abiQueryKeys = {
  all: ['abis'] as const,
  lists: () => [...abiQueryKeys.all, 'list'] as const,
  list: (filters: { network?: string; page?: number }) =>
    [...abiQueryKeys.lists(), filters] as const,
  details: () => [...abiQueryKeys.all, 'detail'] as const,
  detail: (contractName: string, network: string) =>
    [...abiQueryKeys.details(), contractName, network] as const,
  byId: (abiId: string) =>
    [...abiQueryKeys.details(), 'id', abiId] as const,
  contracts: (address: string, networkId: string) =>
    ['contracts', address, networkId] as const,
  networks: () => ['networks'] as const,
  network: (chainId: number) => [...abiQueryKeys.networks(), chainId] as const,
};

/**
 * Query options factory for ABI fetching
 * Use these with useQuery for consistent caching behavior
 */
export function createABIQueryOptions(
  client: ZunoAPIClient,
  contractName: string,
  network: string
) {
  return {
    queryKey: abiQueryKeys.detail(contractName, network),
    queryFn: () => client.getABI(contractName, network),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  };
}

export function createABIByIdQueryOptions(
  client: ZunoAPIClient,
  abiId: string
) {
  return {
    queryKey: abiQueryKeys.byId(abiId),
    queryFn: () => client.getABIById(abiId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  };
}

export function createContractInfoQueryOptions(
  client: ZunoAPIClient,
  address: string,
  networkId: string
) {
  return {
    queryKey: abiQueryKeys.contracts(address, networkId),
    queryFn: () => client.getContractInfo(address, networkId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  };
}

// Types from zuno-marketplace-abis
export interface AbiEntity {
  id: string;
  name: string;
  description: string | null;
  contractName: string | null;
  abi: unknown; // JSON ABI
  abiHash: string;
  version: string;
  tags: string[];
  standard: string | null;
  metadata: Record<string, unknown> | null;
  ipfsHash: string | null;
  ipfsUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractEntity {
  id: string;
  address: string;
  networkId: string;
  abiId: string;
  name: string | null;
  verified: boolean;
  deployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkEntity {
  id: string;
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string | null;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}
```

### 3. ContractRegistry - Smart ABI Caching with TanStack Query

**✨ TanStack Query handles all caching automatically!**

Since we're using TanStack Query, we don't need a manual cache implementation. The QueryClient handles:
- Automatic caching with configurable TTL
- Request deduplication
- Background refetching
- Cache invalidation
- Persistence (optional)

```typescript
// ============ Contract Registry with TanStack Query ============
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

export class ContractRegistry {
  private apiClient: ZunoAPIClient;
  private queryClient: QueryClient;

  constructor(apiClient: ZunoAPIClient, queryClient: QueryClient) {
    this.apiClient = apiClient;
    this.queryClient = queryClient;
  }

  /**
   * Get contract instance with ABI fetched via TanStack Query
   * Benefits: Automatic caching, deduplication, and refetching
   */
  async getContract(
    contractType: ContractType,
    network: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    // Use TanStack Query to fetch ABI (with automatic caching)
    const abiEntity = await this.queryClient.fetchQuery(
      createABIQueryOptions(this.apiClient, contractType, network)
    );

    if (!abiEntity.contractAddress) {
      throw new ZunoSDKError(
        'CONTRACT_ADDRESS_NOT_FOUND',
        `Contract address not found for ${contractType} on ${network}`
      );
    }

    return new ethers.Contract(
      abiEntity.contractAddress,
      abiEntity.abi,
      signer || provider
    );
  }

  /**
   * Get ABI for a specific contract address
   * First fetches contract info, then fetches the ABI
   */
  async getABI(contractAddress: string, network: string): Promise<unknown> {
    // Fetch contract info (cached)
    const contractInfo = await this.queryClient.fetchQuery(
      createContractInfoQueryOptions(this.apiClient, contractAddress, network)
    );

    // Fetch ABI using the abiId (cached)
    const abiEntity = await this.queryClient.fetchQuery(
      createABIByIdQueryOptions(this.apiClient, contractInfo.abiId)
    );

    return abiEntity.abi;
  }

  /**
   * Prefetch ABIs for better performance
   * Loads ABIs into cache before they're needed
   */
  async prefetchABIs(contractTypes: ContractType[], network: string): Promise<void> {
    await Promise.all(
      contractTypes.map(type =>
        this.queryClient.prefetchQuery(
          createABIQueryOptions(this.apiClient, type, network)
        )
      )
    );
  }

  /**
   * Clear all ABI cache
   * Useful when switching networks or after configuration changes
   */
  async clearCache(): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: abiQueryKeys.all,
    });
  }

  /**
   * Clear specific ABI from cache
   */
  async clearABI(contractType: ContractType, network: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: abiQueryKeys.detail(contractType, network),
    });
  }

  /**
   * Get cached ABI without fetching (returns undefined if not in cache)
   */
  getCachedABI(contractType: ContractType, network: string): AbiEntity | undefined {
    return this.queryClient.getQueryData(
      abiQueryKeys.detail(contractType, network)
    );
  }

  /**
   * Check if ABI is in cache
   */
  hasABI(contractType: ContractType, network: string): boolean {
    const state = this.queryClient.getQueryState(
      abiQueryKeys.detail(contractType, network)
    );
    return state?.status === 'success';
  }
}

type ContractType =
  | 'ERC721NFTExchange'
  | 'ERC1155NFTExchange'
  | 'ERC721CollectionFactory'
  | 'ERC1155CollectionFactory'
  | 'EnglishAuction'
  | 'DutchAuction'
  | 'AuctionFactory'
  | 'OfferManager'
  | 'BundleManager'
  | 'UserHub'
  | 'AdminHub';
```

---

## 📦 Module System

### Base Module

```typescript
// ============ Base Module for All Features ============
export abstract class BaseModule {
  protected sdk: ZunoSDK;

  constructor(sdk: ZunoSDK) {
    this.sdk = sdk;
  }

  protected async getContract(type: ContractType): Promise<ethers.Contract> {
    const provider = this.sdk.getProvider();
    const signer = this.sdk.getSigner();

    if (!provider) {
      throw new ZunoSDKError('PROVIDER_NOT_FOUND', 'Provider is required');
    }

    return await this.sdk['contractRegistry'].getContract(
      type,
      this.sdk['config'].network.toString(),
      provider,
      signer
    );
  }

  protected async waitForTransaction(
    tx: ethers.TransactionResponse,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt> {
    const receipt = await tx.wait(confirmations);
    if (!receipt) {
      throw new ZunoSDKError('TX_FAILED', 'Transaction failed');
    }
    return receipt;
  }

  protected parseError(error: any): ZunoSDKError {
    // Parse contract errors, network errors, etc.
    return new ZunoSDKError('UNKNOWN_ERROR', error.message, error);
  }
}
```

### Exchange Module

```typescript
// ============ Exchange Module - Marketplace Trading ============
export class ExchangeModule extends BaseModule {
  // List NFT for sale
  async listNFT(params: {
    collectionAddress: string;
    tokenId: string;
    price: string; // in wei
    duration: number; // in seconds
    paymentToken?: string; // ERC20 token address (optional, ETH if not provided)
  }): Promise<TransactionResponse> {
    const contract = await this.getContract('ERC721NFTExchange');

    const tx = await contract.createListing(
      params.collectionAddress,
      params.tokenId,
      params.price,
      params.duration,
      params.paymentToken || ethers.ZeroAddress
    );

    return tx;
  }

  // Buy listed NFT
  async buyNFT(listingId: string, value?: string): Promise<TransactionResponse> {
    const contract = await this.getContract('ERC721NFTExchange');

    const tx = await contract.buyListing(listingId, {
      value: value || 0
    });

    return tx;
  }

  // Cancel listing
  async cancelListing(listingId: string): Promise<TransactionResponse> {
    const contract = await this.getContract('ERC721NFTExchange');
    const tx = await contract.cancelListing(listingId);
    return tx;
  }

  // Get listing details
  async getListing(listingId: string): Promise<Listing> {
    const contract = await this.getContract('ERC721NFTExchange');
    const listing = await contract.getListing(listingId);

    return {
      id: listingId,
      seller: listing.seller,
      nftAddress: listing.nftAddress,
      tokenId: listing.tokenId.toString(),
      price: listing.price.toString(),
      paymentToken: listing.paymentToken,
      startTime: Number(listing.startTime),
      endTime: Number(listing.endTime),
      isActive: listing.isActive,
    };
  }

  // Get all listings for collection
  async getListingsByCollection(
    collectionAddress: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<Listing>> {
    const contract = await this.getContract('ERC721NFTExchange');

    // Call contract method (assuming pagination support)
    const result = await contract.getListingsByCollection(
      collectionAddress,
      page,
      limit
    );

    return {
      data: result.listings.map((l: any, i: number) => ({
        id: result.ids[i],
        seller: l.seller,
        nftAddress: l.nftAddress,
        tokenId: l.tokenId.toString(),
        price: l.price.toString(),
        paymentToken: l.paymentToken,
        startTime: Number(l.startTime),
        endTime: Number(l.endTime),
        isActive: l.isActive,
      })),
      pagination: {
        page,
        limit,
        total: Number(result.total),
        totalPages: Math.ceil(Number(result.total) / limit),
        hasNext: page * limit < Number(result.total),
        hasPrev: page > 1,
      },
    };
  }

  // Event listening
  on(event: 'ListingCreated' | 'ListingSold' | 'ListingCancelled', callback: (event: any) => void): void {
    this.getContract('ERC721NFTExchange').then(contract => {
      contract.on(event, callback);
    });
  }
}

export interface Listing {
  id: string;
  seller: string;
  nftAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
}
```

### Collection Module

```typescript
// ============ Collection Module - NFT Collections & Minting ============
export class CollectionModule extends BaseModule {
  // Create new ERC721 collection
  async createERC721Collection(params: {
    name: string;
    symbol: string;
    baseUri: string;
    maxSupply: number;
    royaltyReceiver?: string;
    royaltyFeeNumerator?: number; // basis points (e.g., 250 = 2.5%)
  }): Promise<{ address: string; tx: TransactionResponse }> {
    const factory = await this.getContract('ERC721CollectionFactory');

    const tx = await factory.createCollection(
      params.name,
      params.symbol,
      params.baseUri,
      params.maxSupply,
      params.royaltyReceiver || ethers.ZeroAddress,
      params.royaltyFeeNumerator || 0
    );

    const receipt = await this.waitForTransaction(tx);

    // Parse CollectionCreated event to get address
    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'CollectionCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'CollectionCreated event not found');
    }

    return {
      address: event.args.collection,
      tx,
    };
  }

  // Create new ERC1155 collection
  async createERC1155Collection(params: {
    name: string;
    symbol: string;
    uri: string;
    royaltyReceiver?: string;
    royaltyFeeNumerator?: number;
  }): Promise<{ address: string; tx: TransactionResponse }> {
    const factory = await this.getContract('ERC1155CollectionFactory');

    const tx = await factory.createCollection(
      params.name,
      params.symbol,
      params.uri,
      params.royaltyReceiver || ethers.ZeroAddress,
      params.royaltyFeeNumerator || 0
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'CollectionCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'CollectionCreated event not found');
    }

    return {
      address: event.args.collection,
      tx,
    };
  }

  // Mint NFT (ERC721)
  async mintERC721(
    collectionAddress: string,
    recipient: string,
    tokenUri: string
  ): Promise<{ tokenId: string; tx: TransactionResponse }> {
    const provider = this.sdk.getProvider();
    const signer = this.sdk.getSigner();

    if (!provider || !signer) {
      throw new ZunoSDKError('SIGNER_REQUIRED', 'Signer is required for minting');
    }

    // Get ABI for the collection
    const abi = await this.sdk['contractRegistry'].getABI(
      collectionAddress,
      this.sdk['config'].network.toString()
    );

    const collection = new ethers.Contract(collectionAddress, abi, signer);

    const tx = await collection.mint(recipient, tokenUri);
    const receipt = await this.waitForTransaction(tx);

    // Parse Transfer event to get tokenId
    const transferEvent = receipt.logs
      .map(log => {
        try {
          return collection.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'Transfer');

    if (!transferEvent) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'Transfer event not found');
    }

    return {
      tokenId: transferEvent.args.tokenId.toString(),
      tx,
    };
  }

  // Mint NFT (ERC1155)
  async mintERC1155(
    collectionAddress: string,
    recipient: string,
    tokenId: string,
    amount: number,
    data = '0x'
  ): Promise<TransactionResponse> {
    const provider = this.sdk.getProvider();
    const signer = this.sdk.getSigner();

    if (!provider || !signer) {
      throw new ZunoSDKError('SIGNER_REQUIRED', 'Signer is required for minting');
    }

    const abi = await this.sdk['contractRegistry'].getABI(
      collectionAddress,
      this.sdk['config'].network.toString()
    );

    const collection = new ethers.Contract(collectionAddress, abi, signer);

    const tx = await collection.mint(recipient, tokenId, amount, data);
    return tx;
  }

  // Batch mint (ERC721)
  async batchMintERC721(
    collectionAddress: string,
    recipients: string[],
    tokenUris: string[]
  ): Promise<{ tokenIds: string[]; tx: TransactionResponse }> {
    if (recipients.length !== tokenUris.length) {
      throw new ZunoSDKError('INVALID_PARAMS', 'Recipients and tokenUris length mismatch');
    }

    const provider = this.sdk.getProvider();
    const signer = this.sdk.getSigner();

    if (!provider || !signer) {
      throw new ZunoSDKError('SIGNER_REQUIRED', 'Signer is required for minting');
    }

    const abi = await this.sdk['contractRegistry'].getABI(
      collectionAddress,
      this.sdk['config'].network.toString()
    );

    const collection = new ethers.Contract(collectionAddress, abi, signer);

    const tx = await collection.batchMint(recipients, tokenUris);
    const receipt = await this.waitForTransaction(tx);

    // Parse all Transfer events
    const tokenIds = receipt.logs
      .map(log => {
        try {
          const parsed = collection.interface.parseLog(log);
          return parsed?.name === 'Transfer' ? parsed.args.tokenId.toString() : null;
        } catch {
          return null;
        }
      })
      .filter(id => id !== null) as string[];

    return { tokenIds, tx };
  }

  // Verify collection on-chain
  async verifyCollection(address: string): Promise<{
    isValid: boolean;
    tokenType: 'ERC721' | 'ERC1155' | 'Unknown';
  }> {
    const userHub = await this.getContract('UserHub');

    const result = await userHub.verifyCollection(address);

    return {
      isValid: result.isValid,
      tokenType: result.tokenType === 0 ? 'ERC721' :
                 result.tokenType === 1 ? 'ERC1155' : 'Unknown',
    };
  }
}
```

### Auction Module

```typescript
// ============ Auction Module - English & Dutch Auctions ============
export class AuctionModule extends BaseModule {
  // Create English auction
  async createEnglishAuction(params: {
    nftAddress: string;
    tokenId: string;
    startingBid: string;
    duration: number;
    reservePrice?: string;
    paymentToken?: string;
  }): Promise<{ auctionId: string; tx: TransactionResponse }> {
    const factory = await this.getContract('AuctionFactory');

    const tx = await factory.createEnglishAuction(
      params.nftAddress,
      params.tokenId,
      params.startingBid,
      params.duration,
      params.reservePrice || 0,
      params.paymentToken || ethers.ZeroAddress
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'AuctionCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'AuctionCreated event not found');
    }

    return {
      auctionId: event.args.auctionId.toString(),
      tx,
    };
  }

  // Create Dutch auction
  async createDutchAuction(params: {
    nftAddress: string;
    tokenId: string;
    startPrice: string;
    endPrice: string;
    duration: number;
    paymentToken?: string;
  }): Promise<{ auctionId: string; tx: TransactionResponse }> {
    const factory = await this.getContract('AuctionFactory');

    const tx = await factory.createDutchAuction(
      params.nftAddress,
      params.tokenId,
      params.startPrice,
      params.endPrice,
      params.duration,
      params.paymentToken || ethers.ZeroAddress
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'AuctionCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'AuctionCreated event not found');
    }

    return {
      auctionId: event.args.auctionId.toString(),
      tx,
    };
  }

  // Place bid
  async placeBid(
    auctionId: string,
    amount: string
  ): Promise<TransactionResponse> {
    const englishAuction = await this.getContract('EnglishAuction');

    const tx = await englishAuction.placeBid(auctionId, {
      value: amount
    });

    return tx;
  }

  // End auction
  async endAuction(auctionId: string): Promise<TransactionResponse> {
    const englishAuction = await this.getContract('EnglishAuction');
    const tx = await englishAuction.endAuction(auctionId);
    return tx;
  }

  // Get auction details
  async getAuction(auctionId: string): Promise<Auction> {
    const englishAuction = await this.getContract('EnglishAuction');
    const auction = await englishAuction.getAuction(auctionId);

    return {
      id: auctionId,
      seller: auction.seller,
      nftAddress: auction.nftAddress,
      tokenId: auction.tokenId.toString(),
      startingBid: auction.startingBid.toString(),
      currentBid: auction.currentBid.toString(),
      highestBidder: auction.highestBidder,
      startTime: Number(auction.startTime),
      endTime: Number(auction.endTime),
      isActive: auction.isActive,
    };
  }

  // Event listening
  on(event: 'AuctionCreated' | 'BidPlaced' | 'AuctionEnded', callback: (event: any) => void): void {
    this.getContract('EnglishAuction').then(contract => {
      contract.on(event, callback);
    });
  }
}

export interface Auction {
  id: string;
  seller: string;
  nftAddress: string;
  tokenId: string;
  startingBid: string;
  currentBid: string;
  highestBidder: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
}
```

### Offer Module

```typescript
// ============ Offer Module - Make & Accept Offers ============
export class OfferModule extends BaseModule {
  // Make offer on specific NFT
  async makeOffer(params: {
    nftAddress: string;
    tokenId: string;
    price: string;
    duration: number;
    paymentToken?: string;
  }): Promise<{ offerId: string; tx: TransactionResponse }> {
    const offerManager = await this.getContract('OfferManager');

    const tx = await offerManager.makeOffer(
      params.nftAddress,
      params.tokenId,
      params.price,
      params.duration,
      params.paymentToken || ethers.ZeroAddress,
      { value: params.paymentToken ? 0 : params.price }
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return offerManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'OfferCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'OfferCreated event not found');
    }

    return {
      offerId: event.args.offerId.toString(),
      tx,
    };
  }

  // Make collection offer
  async makeCollectionOffer(params: {
    collectionAddress: string;
    price: string;
    duration: number;
    paymentToken?: string;
  }): Promise<{ offerId: string; tx: TransactionResponse }> {
    const offerManager = await this.getContract('OfferManager');

    const tx = await offerManager.makeCollectionOffer(
      params.collectionAddress,
      params.price,
      params.duration,
      params.paymentToken || ethers.ZeroAddress,
      { value: params.paymentToken ? 0 : params.price }
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return offerManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'CollectionOfferCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'CollectionOfferCreated event not found');
    }

    return {
      offerId: event.args.offerId.toString(),
      tx,
    };
  }

  // Accept offer
  async acceptOffer(offerId: string): Promise<TransactionResponse> {
    const offerManager = await this.getContract('OfferManager');
    const tx = await offerManager.acceptOffer(offerId);
    return tx;
  }

  // Cancel offer
  async cancelOffer(offerId: string): Promise<TransactionResponse> {
    const offerManager = await this.getContract('OfferManager');
    const tx = await offerManager.cancelOffer(offerId);
    return tx;
  }

  // Get offer details
  async getOffer(offerId: string): Promise<Offer> {
    const offerManager = await this.getContract('OfferManager');
    const offer = await offerManager.getOffer(offerId);

    return {
      id: offerId,
      offerer: offer.offerer,
      nftAddress: offer.nftAddress,
      tokenId: offer.tokenId.toString(),
      price: offer.price.toString(),
      paymentToken: offer.paymentToken,
      expiresAt: Number(offer.expiresAt),
      isActive: offer.isActive,
    };
  }
}

export interface Offer {
  id: string;
  offerer: string;
  nftAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  expiresAt: number;
  isActive: boolean;
}
```

### Bundle Module

```typescript
// ============ Bundle Module - Multi-NFT Trading ============
export class BundleModule extends BaseModule {
  // Create bundle
  async createBundle(params: {
    nfts: Array<{ address: string; tokenId: string }>;
    price: string;
    duration: number;
    paymentToken?: string;
  }): Promise<{ bundleId: string; tx: TransactionResponse }> {
    const bundleManager = await this.getContract('BundleManager');

    const nftAddresses = params.nfts.map(nft => nft.address);
    const tokenIds = params.nfts.map(nft => nft.tokenId);

    const tx = await bundleManager.createBundle(
      nftAddresses,
      tokenIds,
      params.price,
      params.duration,
      params.paymentToken || ethers.ZeroAddress
    );

    const receipt = await this.waitForTransaction(tx);

    const event = receipt.logs
      .map(log => {
        try {
          return bundleManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'BundleCreated');

    if (!event) {
      throw new ZunoSDKError('EVENT_NOT_FOUND', 'BundleCreated event not found');
    }

    return {
      bundleId: event.args.bundleId.toString(),
      tx,
    };
  }

  // Buy bundle
  async buyBundle(bundleId: string, value?: string): Promise<TransactionResponse> {
    const bundleManager = await this.getContract('BundleManager');

    const tx = await bundleManager.buyBundle(bundleId, {
      value: value || 0
    });

    return tx;
  }

  // Cancel bundle
  async cancelBundle(bundleId: string): Promise<TransactionResponse> {
    const bundleManager = await this.getContract('BundleManager');
    const tx = await bundleManager.cancelBundle(bundleId);
    return tx;
  }

  // Get bundle details
  async getBundle(bundleId: string): Promise<Bundle> {
    const bundleManager = await this.getContract('BundleManager');
    const bundle = await bundleManager.getBundle(bundleId);

    return {
      id: bundleId,
      seller: bundle.seller,
      nfts: bundle.nftAddresses.map((addr: string, i: number) => ({
        address: addr,
        tokenId: bundle.tokenIds[i].toString(),
      })),
      price: bundle.price.toString(),
      paymentToken: bundle.paymentToken,
      expiresAt: Number(bundle.expiresAt),
      isActive: bundle.isActive,
    };
  }
}

export interface Bundle {
  id: string;
  seller: string;
  nfts: Array<{ address: string; tokenId: string }>;
  price: string;
  paymentToken: string;
  expiresAt: number;
  isActive: boolean;
}
```

---

## 🎣 React Hooks

### Provider Setup (All-in-One)

**✨ Một Provider Bao Gồm Tất Cả!**

ZunoProvider tự động bọc Wagmi, React Query, và SDK - không cần config gì thêm!

```typescript
// ============ React Provider (All-in-One) ============
// react/provider/ZunoProvider.tsx
import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { ZunoSDK, ZunoSDKConfig } from '../../core/ZunoSDK';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

interface ZunoContextValue {
  sdk: ZunoSDK;
}

const ZunoContext = createContext<ZunoContextValue | undefined>(undefined);

export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;

  // Optional: Advanced configuration
  queryClient?: QueryClient;
  wagmiConfig?: any;
  enableDevTools?: boolean; // Default: true in development
}

export function ZunoProvider({
  config,
  children,
  queryClient: customQueryClient,
  wagmiConfig: customWagmiConfig,
  enableDevTools = process.env.NODE_ENV === 'development'
}: ZunoProviderProps) {
  // Create QueryClient (singleton)
  const [queryClient] = useState(() =>
    customQueryClient || new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config.cache?.ttl || 300000, // 5 minutes
          gcTime: (config.cache?.ttl || 300000) * 2, // 10 minutes
          refetchOnWindowFocus: false,
          retry: config.retryPolicy?.maxRetries || 3,
          retryDelay: (attemptIndex: number) => {
            if (config.retryPolicy?.backoff === 'linear') {
              return 1000 * (attemptIndex + 1);
            }
            return Math.min(1000 * 2 ** attemptIndex, 30000);
          },
        },
      },
    })
  );

  // Create Wagmi config (singleton)
  const [wagmiConfig] = useState(() => {
    if (customWagmiConfig) return customWagmiConfig;

    // Tự động tạo Wagmi config dựa trên network
    const chainMap: Record<string | number, any> = {
      mainnet: mainnet,
      sepolia: sepolia,
      polygon: polygon,
      arbitrum: arbitrum,
      1: mainnet,
      11155111: sepolia,
      137: polygon,
      42161: arbitrum,
    };

    const chain = chainMap[config.network] || sepolia;

    return createConfig({
      chains: [chain],
      connectors: [
        injected(),
        walletConnect({
          projectId: config.walletConnectProjectId || 'YOUR_PROJECT_ID'
        }),
        coinbaseWallet({ appName: 'Zuno Marketplace' }),
      ],
      transports: {
        [chain.id]: http(config.rpcUrl),
      },
    });
  });

  // Create SDK instance
  const sdk = useMemo(() => {
    return new ZunoSDK(config, { queryClient });
  }, [config, queryClient]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContext.Provider value={{ sdk }}>
          {children}
          {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
        </ZunoContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);
  if (!context) {
    throw new Error('useZuno must be used within ZunoProvider');
  }
  return context.sdk;
}
```

### Exchange Hooks

```typescript
// ============ Exchange Hooks ============
// react/hooks/useExchange.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useExchange() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const listNFT = useMutation({
    mutationFn: (params: {
      collectionAddress: string;
      tokenId: string;
      price: string;
      duration: number;
      paymentToken?: string;
    }) => sdk.exchange.listNFT(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const buyNFT = useMutation({
    mutationFn: ({ listingId, value }: { listingId: string; value?: string }) =>
      sdk.exchange.buyNFT(listingId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const cancelListing = useMutation({
    mutationFn: (listingId: string) => sdk.exchange.cancelListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return {
    listNFT,
    buyNFT,
    cancelListing,
  };
}

export function useListings(collectionAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listings', collectionAddress],
    queryFn: () =>
      collectionAddress
        ? sdk.exchange.getListingsByCollection(collectionAddress)
        : Promise.resolve({ data: [], pagination: {} }),
    enabled: !!collectionAddress,
  });
}

export function useListing(listingId: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => sdk.exchange.getListing(listingId),
    enabled: !!listingId,
  });
}
```

### Collection Hooks

```typescript
// ============ Collection Hooks ============
// react/hooks/useCollection.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useCollection() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createERC721 = useMutation({
    mutationFn: (params: {
      name: string;
      symbol: string;
      baseUri: string;
      maxSupply: number;
      royaltyReceiver?: string;
      royaltyFeeNumerator?: number;
    }) => sdk.collection.createERC721Collection(params),
  });

  const createERC1155 = useMutation({
    mutationFn: (params: {
      name: string;
      symbol: string;
      uri: string;
      royaltyReceiver?: string;
      royaltyFeeNumerator?: number;
    }) => sdk.collection.createERC1155Collection(params),
  });

  const mintERC721 = useMutation({
    mutationFn: ({
      collectionAddress,
      recipient,
      tokenUri,
    }: {
      collectionAddress: string;
      recipient: string;
      tokenUri: string;
    }) => sdk.collection.mintERC721(collectionAddress, recipient, tokenUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const mintERC1155 = useMutation({
    mutationFn: ({
      collectionAddress,
      recipient,
      tokenId,
      amount,
      data,
    }: {
      collectionAddress: string;
      recipient: string;
      tokenId: string;
      amount: number;
      data?: string;
    }) => sdk.collection.mintERC1155(collectionAddress, recipient, tokenId, amount, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const batchMintERC721 = useMutation({
    mutationFn: ({
      collectionAddress,
      recipients,
      tokenUris,
    }: {
      collectionAddress: string;
      recipients: string[];
      tokenUris: string[];
    }) => sdk.collection.batchMintERC721(collectionAddress, recipients, tokenUris),
  });

  const verify = useMutation({
    mutationFn: (address: string) => sdk.collection.verifyCollection(address),
  });

  return {
    createERC721,
    createERC1155,
    mintERC721,
    mintERC1155,
    batchMintERC721,
    verify,
  };
}
```

### Auction Hooks

```typescript
// ============ Auction Hooks ============
// react/hooks/useAuction.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useAuction() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createEnglish = useMutation({
    mutationFn: (params: {
      nftAddress: string;
      tokenId: string;
      startingBid: string;
      duration: number;
      reservePrice?: string;
      paymentToken?: string;
    }) => sdk.auction.createEnglishAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const createDutch = useMutation({
    mutationFn: (params: {
      nftAddress: string;
      tokenId: string;
      startPrice: string;
      endPrice: string;
      duration: number;
      paymentToken?: string;
    }) => sdk.auction.createDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const placeBid = useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: string }) =>
      sdk.auction.placeBid(auctionId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const endAuction = useMutation({
    mutationFn: (auctionId: string) => sdk.auction.endAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  return {
    createEnglish,
    createDutch,
    placeBid,
    endAuction,
  };
}

export function useAuctionDetails(auctionId: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => sdk.auction.getAuction(auctionId),
    enabled: !!auctionId,
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });
}
```

### Offer Hooks

```typescript
// ============ Offer Hooks ============
// react/hooks/useOffers.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useOffers() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const makeOffer = useMutation({
    mutationFn: (params: {
      nftAddress: string;
      tokenId: string;
      price: string;
      duration: number;
      paymentToken?: string;
    }) => sdk.offers.makeOffer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const makeCollectionOffer = useMutation({
    mutationFn: (params: {
      collectionAddress: string;
      price: string;
      duration: number;
      paymentToken?: string;
    }) => sdk.offers.makeCollectionOffer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const acceptOffer = useMutation({
    mutationFn: (offerId: string) => sdk.offers.acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const cancelOffer = useMutation({
    mutationFn: (offerId: string) => sdk.offers.cancelOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  return {
    makeOffer,
    makeCollectionOffer,
    acceptOffer,
    cancelOffer,
  };
}

export function useOffer(offerId: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => sdk.offers.getOffer(offerId),
    enabled: !!offerId,
  });
}
```

### Bundle Hooks

```typescript
// ============ Bundle Hooks ============
// react/hooks/useBundles.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useBundles() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (params: {
      nfts: Array<{ address: string; tokenId: string }>;
      price: string;
      duration: number;
      paymentToken?: string;
    }) => sdk.bundles.createBundle(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const buy = useMutation({
    mutationFn: ({ bundleId, value }: { bundleId: string; value?: string }) =>
      sdk.bundles.buyBundle(bundleId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const cancel = useMutation({
    mutationFn: (bundleId: string) => sdk.bundles.cancelBundle(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  return {
    create,
    buy,
    cancel,
  };
}

export function useBundle(bundleId: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => sdk.bundles.getBundle(bundleId),
    enabled: !!bundleId,
  });
}
```

### ABI Management Hooks (TanStack Query)

```typescript
// ============ ABI Management Hooks ============
// react/hooks/useABIs.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';
import { createABIQueryOptions, abiQueryKeys, ContractType } from '../../core/ZunoAPIClient';

/**
 * Hook to fetch ABI for a specific contract type
 * Automatically cached and deduplicated by TanStack Query
 */
export function useABI(contractType: ContractType, network: string) {
  const sdk = useZuno();
  const apiClient = sdk['apiClient'];

  return useQuery(createABIQueryOptions(apiClient, contractType, network));
}

/**
 * Hook to fetch contract info by address
 */
export function useContractInfo(address: string, networkId: string) {
  const sdk = useZuno();
  const apiClient = sdk['apiClient'];

  return useQuery(
    createContractInfoQueryOptions(apiClient, address, networkId)
  );
}

/**
 * Hook to prefetch ABIs for better performance
 * Call this early in your app to load ABIs into cache
 */
export function usePrefetchABIs() {
  const sdk = useZuno();
  const queryClient = useQueryClient();
  const apiClient = sdk['apiClient'];

  const prefetch = async (contractTypes: ContractType[], network: string) => {
    await Promise.all(
      contractTypes.map(type =>
        queryClient.prefetchQuery(
          createABIQueryOptions(apiClient, type, network)
        )
      )
    );
  };

  return { prefetch };
}

/**
 * Hook to check if ABIs are loaded in cache
 */
export function useABIsCached(contractTypes: ContractType[], network: string) {
  const queryClient = useQueryClient();

  const cached = contractTypes.map(type => {
    const state = queryClient.getQueryState(
      abiQueryKeys.detail(type, network)
    );
    return {
      contractType: type,
      isCached: state?.status === 'success',
      isLoading: state?.status === 'pending',
    };
  });

  return {
    cached,
    allCached: cached.every(c => c.isCached),
    anyCached: cached.some(c => c.isCached),
    isLoading: cached.some(c => c.isLoading),
  };
}

/**
 * Example: Use in layout to prefetch all ABIs
 */
export function useInitializeABIs() {
  const { prefetch } = usePrefetchABIs();
  const network = 'sepolia'; // or from config

  useEffect(() => {
    // Prefetch all contract ABIs on mount
    prefetch(
      [
        'ERC721NFTExchange',
        'ERC1155NFTExchange',
        'ERC721CollectionFactory',
        'ERC1155CollectionFactory',
        'EnglishAuction',
        'DutchAuction',
        'AuctionFactory',
        'OfferManager',
        'BundleManager',
        'UserHub',
      ],
      network
    );
  }, [network]);
}
```

### Utility Hooks

```typescript
// ============ Utility Hooks ============
// react/hooks/useWallet.ts
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

// react/hooks/useBalance.ts
import { useQuery } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';
import { ethers } from 'ethers';

export function useBalance(address: string, tokenAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['balance', address, tokenAddress],
    queryFn: async () => {
      const provider = sdk.getProvider();
      if (!provider) throw new Error('Provider not found');

      if (tokenAddress) {
        // ERC20 balance
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const balance = await contract.balanceOf(address);
        return balance.toString();
      } else {
        // Native balance
        const balance = await provider.getBalance(address);
        return balance.toString();
      }
    },
    enabled: !!address,
  });
}

// react/hooks/useApprove.ts
import { useMutation } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';
import { ethers } from 'ethers';

export function useApprove() {
  const sdk = useZuno();

  return useMutation({
    mutationFn: async ({
      tokenAddress,
      spender,
      amount,
    }: {
      tokenAddress: string;
      spender: string;
      amount: string;
    }) => {
      const signer = sdk.getSigner();
      if (!signer) throw new Error('Signer not found');

      const contract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );

      const tx = await contract.approve(spender, amount);
      await tx.wait();

      return tx;
    },
  });
}
```

---

## 📚 Usage Examples

### Frontend Usage (Next.js)

#### 1. Configuration (Cực Kỳ Đơn Giản!)

```typescript
// src/config/zuno.config.ts
import { ZunoSDKConfig } from 'zuno-marketplace-sdk';

export const zunoConfig: ZunoSDKConfig = {
  // Required - API key từ zuno-marketplace-abis
  apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,

  // Network configuration
  network: 'sepolia', // or 'mainnet', 'polygon', 'arbitrum', hoặc chainId số

  // Optional - API URL (mặc định: https://api.zuno.com)
  apiUrl: process.env.NEXT_PUBLIC_ZUNO_API_URL,

  // Optional - RPC URL cho network (nếu không có sẽ dùng public RPC)
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,

  // Optional - WalletConnect Project ID (nếu muốn dùng WalletConnect)
  walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,

  // Optional - Cache configuration
  cache: {
    ttl: 300000, // 5 minutes (default)
  },

  // Optional - Retry policy
  retryPolicy: {
    maxRetries: 3,
    backoff: 'exponential',
  },
};
```

**Minimal Configuration (Chỉ cần 2 dòng!):**

```typescript
// src/config/zuno.config.ts
export const zunoConfig = {
  apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
  network: 'sepolia',
};
```

#### 2. Layout Setup (CHỈ 1 PROVIDER!)

**✨ Cực kỳ đơn giản - không cần setup Wagmi hay React Query!**

```tsx
// app/layout.tsx
'use client';

import { ZunoProvider } from 'zuno-marketplace-sdk/react';
import { zunoConfig } from '@/config/zuno.config';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* CHỈ CẦN 1 PROVIDER DUY NHẤT! */}
        <ZunoProvider config={zunoConfig}>
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}
```

**Xong! Không cần:**
- ❌ WagmiProvider
- ❌ QueryClientProvider
- ❌ Tạo wagmiConfig
- ❌ Tạo QueryClient
- ❌ Import ReactQueryDevtools (tự động bật trong development)

**ZunoProvider tự động setup:**
- ✅ Wagmi với connectors (MetaMask, WalletConnect, Coinbase)
- ✅ React Query với caching tối ưu
- ✅ Dev tools cho development
- ✅ Network configuration tự động

#### 2.5. Prefetch ABIs on App Load (Optional - Recommended)

```tsx
// app/layout.tsx
'use client';

import { ZunoProvider, useInitializeABIs } from 'zuno-marketplace-sdk/react';
import { zunoConfig } from '@/config/zuno.config';

function ABIInitializer() {
  // Prefetch all ABIs on mount để load instantly
  useInitializeABIs();
  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ZunoProvider config={zunoConfig}>
          <ABIInitializer />
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}
```

#### 2.6. Monitor ABI Loading Status (Optional)

```tsx
// components/ABIStatus.tsx
import { useABIsCached } from 'zuno-marketplace-sdk/react';

export function ABIStatus() {
  const { allCached, cached, isLoading } = useABIsCached(
    ['ERC721NFTExchange', 'ERC721CollectionFactory'],
    'sepolia'
  );

  if (isLoading) {
    return <div>Loading ABIs...</div>;
  }

  return (
    <div>
      <p>ABIs Status:</p>
      {cached.map(({ contractType, isCached }) => (
        <div key={contractType}>
          {contractType}: {isCached ? '✅ Cached' : '❌ Not Cached'}
        </div>
      ))}
      {allCached && <p className="text-green-500">All ABIs ready!</p>}
    </div>
  );
}
```

#### 2.7. Advanced: Custom Wagmi Config (Optional)

Nếu cần tùy chỉnh Wagmi config:

```tsx
// app/layout.tsx
'use client';

import { ZunoProvider } from 'zuno-marketplace-sdk/react';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { zunoConfig } from '@/config/zuno.config';

// Custom Wagmi config
const customWagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http('https://your-custom-rpc.com'),
    [sepolia.id]: http('https://your-sepolia-rpc.com'),
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ZunoProvider
          config={zunoConfig}
          wagmiConfig={customWagmiConfig} // Override mặc định
        >
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}
```

#### 3. Create & Mint Collection

```tsx
// components/CreateCollection.tsx
import { useState } from 'react';
import { useCollection, useWallet } from 'zuno-marketplace-sdk/react';
import { toast } from 'sonner';

export function CreateCollection() {
  const { createERC721, mintERC721 } = useCollection();
  const { address } = useWallet();
  const [collectionAddress, setCollectionAddress] = useState('');

  const handleCreate = async () => {
    try {
      const result = await createERC721.mutateAsync({
        name: 'My NFT Collection',
        symbol: 'MNC',
        baseUri: 'ipfs://QmXxx/',
        maxSupply: 10000,
        royaltyReceiver: address,
        royaltyFeeNumerator: 250, // 2.5%
      });

      setCollectionAddress(result.address);
      toast.success(`Collection created at ${result.address}`);
    } catch (error) {
      toast.error('Failed to create collection');
      console.error(error);
    }
  };

  const handleMint = async () => {
    if (!collectionAddress || !address) return;

    try {
      const result = await mintERC721.mutateAsync({
        collectionAddress,
        recipient: address,
        tokenUri: 'ipfs://QmYyy/1.json',
      });

      toast.success(`Minted token #${result.tokenId}`);
    } catch (error) {
      toast.error('Failed to mint NFT');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreate}
        disabled={createERC721.isPending}
        className="btn btn-primary"
      >
        {createERC721.isPending ? 'Creating...' : 'Create Collection'}
      </button>

      {collectionAddress && (
        <button
          onClick={handleMint}
          disabled={mintERC721.isPending}
          className="btn btn-secondary"
        >
          {mintERC721.isPending ? 'Minting...' : 'Mint NFT'}
        </button>
      )}
    </div>
  );
}
```

#### 4. List NFT for Sale

```tsx
// components/ListNFT.tsx
import { useExchange, useApprove } from 'zuno-marketplace-sdk/react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export function ListNFT({ nftAddress, tokenId }: { nftAddress: string; tokenId: string }) {
  const { listNFT } = useExchange();
  const { mutateAsync: approve } = useApprove();
  const EXCHANGE_ADDRESS = '0x...'; // Get from UserHub

  const handleList = async () => {
    try {
      // Step 1: Approve exchange to transfer NFT
      await approve({
        tokenAddress: nftAddress,
        spender: EXCHANGE_ADDRESS,
        amount: tokenId,
      });

      toast.success('NFT approved');

      // Step 2: Create listing
      await listNFT.mutateAsync({
        collectionAddress: nftAddress,
        tokenId,
        price: ethers.parseEther('1.0').toString(),
        duration: 86400 * 7, // 7 days
      });

      toast.success('NFT listed successfully!');
    } catch (error) {
      toast.error('Failed to list NFT');
      console.error(error);
    }
  };

  return (
    <button onClick={handleList} disabled={listNFT.isPending}>
      {listNFT.isPending ? 'Listing...' : 'List for 1 ETH'}
    </button>
  );
}
```

#### 5. View & Buy Listings

```tsx
// components/Marketplace.tsx
import { useListings, useExchange } from 'zuno-marketplace-sdk/react';
import { ethers } from 'ethers';

export function Marketplace({ collectionAddress }: { collectionAddress: string }) {
  const { data: listings, isLoading } = useListings(collectionAddress);
  const { buyNFT } = useExchange();

  const handleBuy = async (listingId: string, price: string) => {
    try {
      await buyNFT.mutateAsync({
        listingId,
        value: price
      });
      toast.success('NFT purchased successfully!');
    } catch (error) {
      toast.error('Failed to buy NFT');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {listings?.data.map((listing) => (
        <div key={listing.id} className="card">
          <h3>Token #{listing.tokenId}</h3>
          <p>Price: {ethers.formatEther(listing.price)} ETH</p>
          <p>Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
          <button
            onClick={() => handleBuy(listing.id, listing.price)}
            disabled={buyNFT.isPending}
          >
            Buy Now
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### 6. Create Auction

```tsx
// components/CreateAuction.tsx
import { useAuction } from 'zuno-marketplace-sdk/react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

export function CreateAuction({ nftAddress, tokenId }: { nftAddress: string; tokenId: string }) {
  const { createEnglish, createDutch } = useAuction();
  const router = useRouter();

  const handleEnglishAuction = async () => {
    try {
      const result = await createEnglish.mutateAsync({
        nftAddress,
        tokenId,
        startingBid: ethers.parseEther('0.5').toString(),
        duration: 86400 * 3, // 3 days
        reservePrice: ethers.parseEther('2.0').toString(),
      });

      toast.success('Auction created!');
      router.push(`/auction/${result.auctionId}`);
    } catch (error) {
      toast.error('Failed to create auction');
    }
  };

  const handleDutchAuction = async () => {
    try {
      const result = await createDutch.mutateAsync({
        nftAddress,
        tokenId,
        startPrice: ethers.parseEther('2.0').toString(),
        endPrice: ethers.parseEther('0.5').toString(),
        duration: 86400 * 3, // 3 days
      });

      toast.success('Dutch auction created!');
      router.push(`/auction/${result.auctionId}`);
    } catch (error) {
      toast.error('Failed to create auction');
    }
  };

  return (
    <div className="space-x-4">
      <button onClick={handleEnglishAuction}>Start English Auction</button>
      <button onClick={handleDutchAuction}>Start Dutch Auction</button>
    </div>
  );
}
```

#### 7. Auction Details with Live Updates

```tsx
// app/auction/[id]/page.tsx
import { useAuctionDetails, useAuction } from 'zuno-marketplace-sdk/react';
import { ethers } from 'ethers';
import { useState } from 'react';

export default function AuctionPage({ params }: { params: { id: string } }) {
  const { data: auction, isLoading } = useAuctionDetails(params.id);
  const { placeBid, endAuction } = useAuction();
  const [bidAmount, setBidAmount] = useState('');

  const handleBid = async () => {
    try {
      await placeBid.mutateAsync({
        auctionId: params.id,
        amount: ethers.parseEther(bidAmount).toString(),
      });
      toast.success('Bid placed successfully!');
      setBidAmount('');
    } catch (error) {
      toast.error('Failed to place bid');
    }
  };

  const handleEndAuction = async () => {
    try {
      await endAuction.mutateAsync(params.id);
      toast.success('Auction ended!');
    } catch (error) {
      toast.error('Failed to end auction');
    }
  };

  if (isLoading) return <div>Loading auction...</div>;
  if (!auction) return <div>Auction not found</div>;

  const timeRemaining = auction.endTime - Math.floor(Date.now() / 1000);
  const isActive = auction.isActive && timeRemaining > 0;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Auction #{params.id}</h1>

      <div className="card">
        <p>NFT: {auction.nftAddress}</p>
        <p>Token ID: #{auction.tokenId}</p>
        <p>Starting Bid: {ethers.formatEther(auction.startingBid)} ETH</p>
        <p>Current Bid: {ethers.formatEther(auction.currentBid)} ETH</p>
        <p>Highest Bidder: {auction.highestBidder}</p>
        <p>Time Remaining: {Math.max(0, Math.floor(timeRemaining / 60))} minutes</p>
        <p>Status: {isActive ? '🟢 Active' : '🔴 Ended'}</p>
      </div>

      {isActive && (
        <div className="mt-4">
          <input
            type="number"
            step="0.01"
            placeholder="Bid amount (ETH)"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="input"
          />
          <button
            onClick={handleBid}
            disabled={placeBid.isPending || !bidAmount}
            className="btn btn-primary ml-2"
          >
            Place Bid
          </button>
        </div>
      )}

      {!isActive && auction.seller === address && (
        <button
          onClick={handleEndAuction}
          disabled={endAuction.isPending}
          className="btn btn-danger mt-4"
        >
          End Auction
        </button>
      )}
    </div>
  );
}
```

### Backend Usage (Node.js)

```typescript
// server/mint-service.ts
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { ethers } from 'ethers';
import 'dotenv/config';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const sdk = new ZunoSDK(
  {
    apiKey: process.env.ZUNO_API_KEY!,
    apiUrl: 'https://api.zuno.com',
    network: 'mainnet',
  },
  {
    provider,
    signer: wallet,
  }
);

// Mint NFT for user
async function mintForUser(userAddress: string, metadata: object) {
  try {
    // Upload metadata to IPFS
    const ipfsHash = await uploadToIPFS(metadata);

    // Mint NFT
    const result = await sdk.collection.mintERC721(
      process.env.COLLECTION_ADDRESS!,
      userAddress,
      `ipfs://${ipfsHash}`
    );

    // Wait for confirmation
    await result.tx.wait();

    console.log(`Minted token #${result.tokenId} for ${userAddress}`);

    return {
      tokenId: result.tokenId,
      txHash: result.tx.hash
    };
  } catch (error) {
    console.error('Mint failed:', error);
    throw error;
  }
}

// Batch mint for multiple users
async function batchMint(recipients: string[], metadataList: object[]) {
  const ipfsHashes = await Promise.all(
    metadataList.map(metadata => uploadToIPFS(metadata))
  );

  const tokenUris = ipfsHashes.map(hash => `ipfs://${hash}`);

  const result = await sdk.collection.batchMintERC721(
    process.env.COLLECTION_ADDRESS!,
    recipients,
    tokenUris
  );

  await result.tx.wait();

  console.log(`Batch minted ${result.tokenIds.length} NFTs`);

  return result.tokenIds;
}

// Helper function (example)
async function uploadToIPFS(metadata: object): Promise<string> {
  // Implement IPFS upload logic
  return 'QmXxx...';
}
```

---

## 📁 Recommended Project Structure

```
zuno-marketplace-sdk/
├── src/
│   ├── core/
│   │   ├── ZunoSDK.ts              # Main SDK class
│   │   ├── ZunoAPIClient.ts        # API client for zuno-marketplace-abis
│   │   └── ContractRegistry.ts     # ABI caching & contract instances
│   │
│   ├── modules/
│   │   ├── BaseModule.ts           # Abstract base for all modules
│   │   ├── ExchangeModule.ts       # Marketplace trading
│   │   ├── CollectionModule.ts     # NFT collections & minting
│   │   ├── AuctionModule.ts        # Auction system
│   │   ├── OfferModule.ts          # Offer management
│   │   └── BundleModule.ts         # Bundle trading
│   │
│   ├── types/
│   │   ├── config.ts               # SDK configuration types
│   │   ├── entities.ts             # Domain entities (Listing, Auction, etc.)
│   │   ├── api.ts                  # API request/response types
│   │   └── contracts.ts            # Contract interaction types
│   │
│   ├── utils/
│   │   ├── cache.ts                # Caching utilities
│   │   ├── retry.ts                # Retry logic
│   │   ├── validation.ts           # Input validation
│   │   └── errors.ts               # Custom error classes
│   │
│   └── index.ts                    # Main exports
│
├── react/
│   ├── provider/
│   │   └── ZunoProvider.tsx        # React context provider
│   │
│   ├── hooks/
│   │   ├── useZuno.ts              # Core SDK hook
│   │   ├── useExchange.ts          # Exchange hooks
│   │   ├── useCollection.ts        # Collection hooks
│   │   ├── useAuction.ts           # Auction hooks
│   │   ├── useOffers.ts            # Offer hooks
│   │   ├── useBundles.ts           # Bundle hooks
│   │   ├── useABIs.ts              # ABI management hooks (TanStack Query)
│   │   ├── useWallet.ts            # Wallet utilities
│   │   ├── useBalance.ts           # Balance checking
│   │   └── useApprove.ts           # Token approvals
│   │
│   └── index.ts                    # React exports
│
├── examples/
│   ├── frontend/
│   │   ├── nextjs/                 # Next.js example
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── config/
│   │   └── react/                  # React example
│   │
│   └── backend/
│       ├── express/                # Express.js example
│       │   ├── routes/
│       │   ├── services/
│       │   └── server.ts
│       └── standalone/             # Standalone scripts
│           ├── mint.ts
│           ├── list.ts
│           └── auction.ts
│
├── tests/
│   ├── unit/                       # Unit tests
│   │   ├── core/
│   │   ├── modules/
│   │   └── utils/
│   ├── integration/                # Integration tests with ABI registry
│   │   ├── api-client.test.ts
│   │   └── contract-registry.test.ts
│   └── e2e/                        # End-to-end tests
│       ├── exchange.test.ts
│       ├── collection.test.ts
│       └── auction.test.ts
│
├── docs/
│   ├── README.md                   # Main documentation
│   ├── API.md                      # API reference
│   ├── INTEGRATION.md              # Integration guide
│   ├── EXAMPLES.md                 # Usage examples
│   └── MIGRATION.md                # Migration guides
│
├── package.json
├── tsconfig.json
├── tsconfig.react.json             # Separate config for React
├── .env.example
├── .gitignore
└── README.md
```

---

## 📦 Dependencies

**✨ All-in-One Package - Zero Config Required!**

Wagmi và React Query đã được đóng gói sẵn trong SDK. User chỉ cần install 1 package duy nhất!

### Core Dependencies
```json
{
  "dependencies": {
    "ethers": "^6.x",
    "axios": "^1.x",
    "@tanstack/query-core": "^5.x",
    "@tanstack/react-query": "^5.x",
    "wagmi": "^2.x",
    "viem": "^2.x",
    "@wagmi/core": "^2.x",
    "@wagmi/connectors": "^5.x"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.x",
    "typescript": "^5.x"
  },
  "peerDependencies": {
    "react": "^18.x || ^19.x",
    "react-dom": "^18.x || ^19.x"
  }
}
```

### Installation

**Chỉ cần 1 lệnh duy nhất:**

```bash
npm install zuno-marketplace-sdk

# Hoặc
yarn add zuno-marketplace-sdk

# Hoặc
pnpm add zuno-marketplace-sdk
```

**Không cần cài thêm gì khác!** ✅
- ❌ Không cần `npm install wagmi`
- ❌ Không cần `npm install @tanstack/react-query`
- ❌ Không cần `npm install viem`
- ❌ Không cần config Wagmi
- ❌ Không cần tạo QueryClient

---

## 🎁 All-in-One Package Benefits

### So sánh: Before vs After

**❌ Before (Traditional SDK):**
```bash
# Install nhiều packages
npm install your-sdk
npm install wagmi viem
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools
npm install @wagmi/core @wagmi/connectors
```

```tsx
// Setup phức tạp
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { YourProvider } from 'your-sdk';

// Manual wagmi config
const wagmiConfig = createConfig({
  chains: [...],
  connectors: [...],
  transports: {...},
});

// Manual query client
const queryClient = new QueryClient({...});

// 3 Providers!!!
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <YourProvider config={config}>
      {children}
    </YourProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**✅ After (Zuno SDK - All-in-One):**
```bash
# Chỉ 1 package duy nhất!
npm install zuno-marketplace-sdk
```

```tsx
// Setup cực đơn giản
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

// CHỈ 1 PROVIDER!
<ZunoProvider config={{ apiKey: '...', network: 'sepolia' }}>
  {children}
</ZunoProvider>
```

### Lợi ích:

1. **Đơn giản hơn 10 lần** - 1 package thay vì 5+ packages
2. **Zero Config** - Không cần setup Wagmi hay React Query
3. **Giảm Bundle Size** - Shared dependencies, không duplicate
4. **Version Compatibility** - Đảm bảo các dependencies tương thích
5. **Better DX** - Developer Experience tốt hơn rất nhiều
6. **Faster Setup** - Từ 30 phút setup xuống còn 2 phút
7. **Less Boilerplate** - Giảm 80% code boilerplate

---

## 🎨 TanStack Query Integration Summary

### How It Works

1. **ZunoAPIClient** - Low-level HTTP client (axios-based)
2. **Query Keys Factory** - Structured cache keys for consistent caching
3. **Query Options Factory** - Reusable query configurations
4. **ContractRegistry** - Uses QueryClient for ABI caching
5. **React Hooks** - useABI, usePrefetchABIs, useABIsCached
6. **Auto-configured** - Tất cả setup tự động trong ZunoProvider

### Benefits in Practice

**Before (Manual Caching):**
```typescript
// Manual cache check
if (cache.has(key) && !isExpired(cache.get(key))) {
  return cache.get(key);
}

// Fetch from API
const data = await fetch(...);

// Store in cache
cache.set(key, { data, timestamp: Date.now() });
```

**After (TanStack Query):**
```typescript
// Automatic caching, deduplication, refetching
const { data } = useQuery(createABIQueryOptions(...));
```

### Real-World Example

```typescript
// Component A requests ABI
const ComponentA = () => {
  const { data: abi } = useABI('ERC721NFTExchange', 'sepolia');
  // Makes API call, stores in cache
};

// Component B requests same ABI (mounted at same time)
const ComponentB = () => {
  const { data: abi } = useABI('ERC721NFTExchange', 'sepolia');
  // Uses cached data, NO API call
};

// Component C requests same ABI (mounted 6 minutes later)
const ComponentC = () => {
  const { data: abi } = useABI('ERC721NFTExchange', 'sepolia');
  // Returns stale data immediately, refetches in background
};
```

### Cache Strategy

```
Request 1 (t=0s):        API call → Cache → Component A
Request 2 (t=0.1s):      Cache (deduplicated) → Component B
Request 3 (t=1m):        Cache (fresh) → Component C
Request 4 (t=6m):        Cache (stale) → Component D + Background refetch
Request 5 (t=11m):       API call (expired) → Cache → Component E
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core SDK (Weeks 1-2)
- ✅ Setup TypeScript project structure
- ✅ Implement ZunoSDK main class
- ✅ Build ZunoAPIClient with axios
- ✅ Create ContractRegistry with caching
- ✅ Implement ExchangeModule
- ✅ Implement CollectionModule
- ✅ Write unit tests for core components
- ✅ Setup error handling & retry logic

**Deliverables:**
- Core SDK package working
- Basic exchange & collection functionality
- Unit test coverage >80%

### Phase 2: Advanced Features (Weeks 3-4)
- ✅ Implement AuctionModule (English & Dutch)
- ✅ Implement OfferModule
- ✅ Implement BundleModule
- ✅ Add event listening capabilities
- ✅ Add transaction management utilities
- ✅ Implement advanced caching strategies
- ✅ Write integration tests with mock API

**Deliverables:**
- All modules implemented
- Event system working
- Integration tests passing

### Phase 3: React Integration (Weeks 5-6)
- ✅ Create ZunoProvider component
- ✅ Implement all React hooks
  - useExchange, useListings, useListing
  - useCollection
  - useAuction, useAuctionDetails
  - useOffers, useOffer
  - useBundles, useBundle
  - useWallet, useBalance, useApprove
- ✅ Setup TanStack Query integration
- ✅ Write React hook tests with React Testing Library
- ✅ Create example Next.js app

**Deliverables:**
- Complete React package
- All hooks tested
- Working Next.js example

### Phase 4: Documentation & Examples (Weeks 7-8)
- ✅ Write comprehensive API documentation
- ✅ Create integration guide
- ✅ Build multiple example projects:
  - Next.js marketplace
  - Express.js backend service
  - Standalone minting script
- ✅ Record video tutorials
- ✅ Setup documentation website (Docusaurus)
- ✅ Write migration guides

**Deliverables:**
- Complete documentation
- 3+ example projects
- Video tutorials
- Doc website live

### Phase 5: Testing & Optimization (Week 9)
- ✅ E2E testing with real testnet
- ✅ Performance optimization
- ✅ Bundle size optimization
- ✅ Security audit of SDK code
- ✅ Load testing API client
- ✅ Gas optimization recommendations

**Deliverables:**
- E2E tests passing
- Performance benchmarks
- Security audit report
- Optimized bundle size

### Phase 6: Release Preparation (Week 10)
- ✅ Semantic versioning setup
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ NPM package publishing
- ✅ Changelog generation
- ✅ Beta testing with early users
- ✅ Collect & implement feedback

**Deliverables:**
- v1.0.0 released to NPM
- CI/CD working
- Beta feedback incorporated

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// tests/unit/modules/ExchangeModule.test.ts
import { ExchangeModule } from '@/modules/ExchangeModule';
import { ZunoSDK } from '@/core/ZunoSDK';

describe('ExchangeModule', () => {
  let sdk: ZunoSDK;
  let exchange: ExchangeModule;

  beforeEach(() => {
    sdk = new ZunoSDK(mockConfig);
    exchange = new ExchangeModule(sdk);
  });

  it('should list NFT with correct parameters', async () => {
    const params = {
      collectionAddress: '0x123...',
      tokenId: '1',
      price: ethers.parseEther('1.0').toString(),
      duration: 86400,
    };

    const tx = await exchange.listNFT(params);

    expect(tx).toBeDefined();
    expect(tx.hash).toBeTruthy();
  });

  it('should throw error when provider is missing', async () => {
    sdk['provider'] = undefined;

    await expect(
      exchange.listNFT(mockParams)
    ).rejects.toThrow('Provider is required');
  });
});
```

### Integration Tests
```typescript
// tests/integration/api-client.test.ts
import { ZunoAPIClient } from '@/core/ZunoAPIClient';

describe('ZunoAPIClient Integration', () => {
  let client: ZunoAPIClient;

  beforeAll(() => {
    client = new ZunoAPIClient(
      process.env.TEST_API_KEY!,
      process.env.TEST_API_URL!
    );
  });

  it('should fetch ABI from registry', async () => {
    const abi = await client.getABI('ERC721NFTExchange', 'sepolia');

    expect(abi).toBeDefined();
    expect(abi.abi).toBeInstanceOf(Array);
    expect(abi.contractName).toBe('ERC721NFTExchange');
  });

  it('should fetch contract info', async () => {
    const contract = await client.getContractInfo(
      '0x123...',
      'sepolia'
    );

    expect(contract).toBeDefined();
    expect(contract.address).toBe('0x123...');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/exchange.test.ts
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { ethers } from 'ethers';

describe('Exchange E2E', () => {
  let sdk: ZunoSDK;
  let provider: ethers.Provider;
  let signer: ethers.Signer;

  beforeAll(async () => {
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    signer = new ethers.Wallet(process.env.TEST_PRIVATE_KEY!, provider);

    sdk = new ZunoSDK(
      {
        apiKey: process.env.ZUNO_API_KEY!,
        apiUrl: process.env.ZUNO_API_URL!,
        network: 'sepolia',
      },
      { provider, signer }
    );
  });

  it('should create listing and buy NFT', async () => {
    // Create listing
    const listTx = await sdk.exchange.listNFT({
      collectionAddress: TEST_COLLECTION,
      tokenId: '1',
      price: ethers.parseEther('0.01').toString(),
      duration: 86400,
    });

    await listTx.wait();

    // Buy listing
    const listings = await sdk.exchange.getListingsByCollection(TEST_COLLECTION);
    const listingId = listings.data[0].id;

    const buyTx = await sdk.exchange.buyNFT(
      listingId,
      ethers.parseEther('0.01').toString()
    );

    await buyTx.wait();

    // Verify listing is no longer active
    const listing = await sdk.exchange.getListing(listingId);
    expect(listing.isActive).toBe(false);
  }, 60000); // 60 second timeout
});
```

---

## 🔐 Error Handling

```typescript
// src/utils/errors.ts
export class ZunoSDKError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ZunoSDKError';
  }
}

export const ErrorCodes = {
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  SIGNER_REQUIRED: 'SIGNER_REQUIRED',
  INVALID_PARAMS: 'INVALID_PARAMS',
  TX_FAILED: 'TX_FAILED',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Usage in modules
throw new ZunoSDKError(
  ErrorCodes.PROVIDER_NOT_FOUND,
  'Provider is required for this operation',
  { operation: 'listNFT' }
);
```

---

## 📝 Additional Features to Consider

### 1. Multi-network Support
```typescript
await sdk.switchNetwork('polygon');
await sdk.switchNetwork(137); // Polygon chainId
```

### 2. Event Subscriptions
```typescript
sdk.exchange.on('ListingCreated', (event) => {
  console.log('New listing:', event);
});
```

### 3. Transaction Options
```typescript
const tx = await sdk.exchange.listNFT(params, {
  gasLimit: 300000,
  maxFeePerGas: ethers.parseUnits('50', 'gwei'),
  onSent: (tx) => console.log('Sent:', tx.hash),
  onConfirmed: (receipt) => console.log('Confirmed:', receipt),
});
```

### 4. Batch Operations
```typescript
await sdk.collection.batchMintERC721(
  collectionAddress,
  recipients,
  tokenUris
);
```

### 5. Analytics & Monitoring
```typescript
sdk.analytics.on('transaction', (event) => {
  // Send to analytics service
  sendToAnalytics(event);
});
```

---

## 🎯 Next Steps

1. **Review this plan** - Make sure architecture aligns with your vision
2. **Setup repository** - Initialize TypeScript project
3. **Start Phase 1** - Begin with core SDK implementation
4. **Iterate** - Build incrementally and test continuously

Would you like me to:
1. ✅ Generate the initial TypeScript boilerplate?
2. ✅ Implement specific modules (Exchange, Collection, etc.)?
3. ✅ Create the React hooks package?
4. ✅ Build example applications?

Let me know which direction you'd like to proceed!