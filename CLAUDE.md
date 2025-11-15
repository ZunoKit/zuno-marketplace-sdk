# CLAUDE.md - Zuno Marketplace SDK

> Comprehensive guide for AI assistants working with the Zuno Marketplace SDK codebase

**Last Updated:** 2025-11-15
**Version:** 1.0.2
**Repository:** https://github.com/ZunoKit/zuno-marketplace-sdk

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Core Concepts](#core-concepts)
4. [Development Workflow](#development-workflow)
5. [Key Conventions](#key-conventions)
6. [Module Pattern](#module-pattern)
7. [React Integration](#react-integration)
8. [Type System](#type-system)
9. [Testing Strategy](#testing-strategy)
10. [Build & Distribution](#build--distribution)
11. [Common Tasks](#common-tasks)
12. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Repository Overview

### What is Zuno Marketplace SDK?

An all-in-one TypeScript SDK for building NFT marketplace applications on Ethereum and EVM-compatible chains. It provides:

- **NFT Marketplace Features**: Exchange, Auctions, Offers, Bundles
- **React Integration**: 21+ hooks with Wagmi & TanStack Query built-in
- **Type Safety**: Full TypeScript support with strict typing
- **Smart Caching**: ABI caching with TanStack Query
- **Modular Architecture**: Use only what you need
- **Production Ready**: Robust error handling and retry mechanisms

### Tech Stack

- **Language**: TypeScript 5.6+ (strict mode)
- **Build Tool**: tsup (esbuild-based)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint 9 with TypeScript plugin
- **Web3 Libraries**:
  - ethers v6.13+
  - wagmi v2.12+
  - viem v2.21+
- **State Management**: TanStack Query v5.59+
- **React**: 18+ (peer dependency)

### Package Exports

The SDK has two main entry points:

1. **Core SDK** (`zuno-marketplace-sdk`)
   - Vanilla JS/TS SDK
   - Works in Node.js and browser
   - Entry: `src/index.ts` → `dist/index.js|mjs`

2. **React Integration** (`zuno-marketplace-sdk/react`)
   - React hooks and providers
   - Built-in Wagmi + React Query
   - Entry: `src/react/index.ts` → `dist/react/index.js|mjs`
   - **Important**: All React files have `"use client"` banner for Next.js App Router

---

## Architecture & Structure

### Directory Structure

```
zuno-marketplace-sdk/
├── src/
│   ├── core/                    # Core SDK classes
│   │   ├── ZunoSDK.ts          # Main SDK class (entry point)
│   │   ├── ZunoAPIClient.ts    # API client with TanStack Query
│   │   └── ContractRegistry.ts  # ABI registry & caching
│   ├── modules/                 # Feature modules
│   │   ├── BaseModule.ts       # Abstract base class for all modules
│   │   ├── ExchangeModule.ts   # NFT marketplace trading
│   │   ├── CollectionModule.ts # NFT collection & minting
│   │   └── AuctionModule.ts    # English & Dutch auctions
│   ├── react/                   # React integration
│   │   ├── provider/
│   │   │   └── ZunoProvider.tsx # All-in-one provider (Wagmi + Query)
│   │   └── hooks/              # 21+ React hooks
│   │       ├── useExchange.ts
│   │       ├── useCollection.ts
│   │       ├── useAuction.ts
│   │       ├── useWallet.ts
│   │       ├── useBalance.ts
│   │       ├── useApprove.ts
│   │       └── useABIs.ts
│   ├── types/                   # TypeScript type definitions
│   │   ├── config.ts           # SDK configuration types
│   │   ├── entities.ts         # Domain entities (Listing, Auction, etc.)
│   │   ├── contracts.ts        # Contract-related types
│   │   └── api.ts              # API request/response types
│   ├── utils/                   # Utility functions
│   │   ├── errors.ts           # Custom error classes & error codes
│   │   ├── events.ts           # Event emitter
│   │   ├── transactions.ts     # Transaction management
│   │   └── helpers.ts          # General helpers
│   ├── __tests__/              # Test files (mirrors src structure)
│   │   ├── core/
│   │   ├── react/
│   │   └── utils/
│   └── index.ts                # Main entry point
├── docs/
│   ├── API.md                  # Complete API reference
│   └── MIGRATION.md            # Migration guide
├── examples/
│   ├── basic-usage.ts          # Node.js/vanilla usage
│   ├── react-example.tsx       # React integration example
│   └── edge-cases.md           # Edge case handling examples
├── dist/                        # Build output (gitignored)
├── package.json
├── tsconfig.json               # Main TypeScript config
├── tsconfig.build.json         # Build-specific config
├── tsup.config.ts              # Build configuration
├── jest.config.js              # Jest configuration
├── eslint.config.mjs           # ESLint flat config
└── CHANGELOG.md                # Version history
```

### Design Patterns

1. **Lazy Module Loading**: Feature modules (exchange, collection, auction) are instantiated on first access via getters
2. **Singleton Registry**: `ContractRegistry` manages ABI caching with TanStack Query
3. **Base Class Inheritance**: All modules extend `BaseModule` for common functionality
4. **Event-Driven Architecture**: `ZunoSDK` extends `EventEmitter` for lifecycle events
5. **Provider/Signer Injection**: Support for runtime provider updates via `updateProvider()`
6. **Query Factory Pattern**: Reusable query options factories for TanStack Query

---

## Core Concepts

### 1. ZunoSDK (Main Class)

**Location**: `src/core/ZunoSDK.ts`

The main SDK class that orchestrates all functionality:

```typescript
const sdk = new ZunoSDK(
  {
    apiKey: 'your-api-key',
    network: 'sepolia',
    debug: true, // Enable debug logging
  },
  {
    provider: ethersProvider,
    signer: ethersSigner,
    queryClient: customQueryClient, // Optional
  }
);
```

**Key Methods**:
- `updateProvider(provider, signer)` - Update blockchain connection
- `prefetchEssentialABIs()` - Prefetch commonly used ABIs
- `prefetchABIs()` - Prefetch all ABIs
- `clearCache()` - Clear all caches

**Module Access** (lazy loaded):
- `sdk.exchange` - ExchangeModule
- `sdk.collection` - CollectionModule
- `sdk.auction` - AuctionModule
- `sdk.offers` - OffersModule (placeholder in v1.0.2)
- `sdk.bundles` - BundlesModule (placeholder in v1.0.2)

### 2. ZunoAPIClient

**Location**: `src/core/ZunoAPIClient.ts`

Handles all API communication with TanStack Query integration:

- **ABI Fetching**: `fetchABI()`, `fetchABIById()`, query factories
- **Network Info**: `fetchNetworks()`, `fetchContractInfo()`
- **Caching**: Built-in with TanStack Query (5min stale, 10min GC by default)
- **Retry Logic**: Exponential backoff (3 retries by default)

**Query Keys Pattern**:
```typescript
abiQueryKeys.all()                          // ['abis']
abiQueryKeys.byNetwork(networkId)           // ['abis', networkId]
abiQueryKeys.byType(networkId, contractType) // ['abis', networkId, contractType]
```

### 3. ContractRegistry

**Location**: `src/core/ContractRegistry.ts`

Manages contract ABIs with intelligent caching:

- **Caching Strategy**: TanStack Query with configurable TTL
- **Prefetching**: Essential ABIs prefetched on SDK init
- **Type Safety**: Validates contract types before fetching

### 4. BaseModule (Abstract Class)

**Location**: `src/modules/BaseModule.ts`

All feature modules inherit from this:

**Protected Utilities**:
- `ensureProvider()` - Throws if provider not available
- `ensureSigner()` - Throws if signer not available (wallet not connected)
- `ensureTxManager()` - Throws if transaction manager not initialized
- `getNetworkId()` - Get network ID as string
- `error(code, message, details)` - Create formatted error
- `batchExecute(operations, options)` - Parallel operation execution

### 5. Module Pattern

Each module follows this structure:

```typescript
export class ExampleModule extends BaseModule {
  // Constructor receives dependencies from ZunoSDK
  constructor(
    apiClient: ZunoAPIClient,
    contractRegistry: ContractRegistry,
    queryClient: QueryClient,
    network: NetworkType,
    provider?: ethers.Provider,
    signer?: ethers.Signer
  ) {
    super(apiClient, contractRegistry, queryClient, network, provider, signer);
  }

  // Public async methods for operations
  async performAction(params: ActionParams): Promise<TransactionReceipt> {
    const signer = this.ensureSigner(); // Validate requirements
    const abi = await this.contractRegistry.getABI('ContractType', this.getNetworkId());
    // ... implementation
  }
}
```

---

## Development Workflow

### Initial Setup

```bash
npm install              # Install dependencies
npm run type-check       # Verify TypeScript setup
npm run build            # Build the package
```

### Daily Development

```bash
npm run dev              # Watch mode (rebuilds on changes)
npm run type-check       # Check types without emitting
npm run lint             # Lint code
npm run lint:fix         # Auto-fix linting issues
npm test                 # Run tests
npm test:watch           # Tests in watch mode
npm test:coverage        # Generate coverage report
```

### Build Process

The build uses `tsup` which creates:

1. **Main SDK Bundle**:
   - ESM: `dist/index.mjs`
   - CJS: `dist/index.js`
   - Types: `dist/index.d.ts`

2. **React Bundle**:
   - ESM: `dist/react/index.mjs` (with "use client" banner)
   - CJS: `dist/react/index.js` (with "use client" banner)
   - Types: `dist/react/index.d.ts`

**External Dependencies**: React, ethers, wagmi, viem, TanStack Query are marked external (not bundled)

### Testing

**Framework**: Jest with ts-jest
**Environment**: jsdom (for React testing)
**Coverage Threshold**: 70% (branches, functions, lines, statements)

**Test File Locations**:
- Mirror `src/` structure in `src/__tests__/`
- Example: `src/core/ZunoSDK.ts` → `src/__tests__/core/ZunoSDK.test.ts`
- React hooks: `src/react/hooks/useExchange.ts` → `src/__tests__/react/useExchange.test.tsx`

**Running Tests**:
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage
```

### Linting

**Configuration**: `eslint.config.mjs` (flat config format)
**Rules**:
- Unused vars/params warning (allow `_` prefix)
- `any` type warning (not error)
- `console.log` warning (allow `console.warn`/`console.error`)
- `prefer-const` and `no-var` enforced

### Type Checking

**Configuration**: `tsconfig.json` (strict mode enabled)
**Key Settings**:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

---

## Key Conventions

### Naming Conventions

#### ✅ CORRECT (Standardized in v1.0.2)
- **Parameter**: `collectionAddress` - For NFT contract addresses
- **Parameter**: `tokenId` - For NFT token IDs
- **Parameter**: `price`, `amount`, `value` - For monetary values (as strings)
- **Parameter**: `duration` - For time periods (in seconds)

#### ❌ DEPRECATED (Remove from new code)
- ~~`nftAddress`~~ → Use `collectionAddress`

### Parameter Patterns

**Blockchain Addresses**:
- Always lowercase: `collectionAddress`, `tokenAddress`, `recipientAddress`
- Exception: User address is just `address` in wallet hooks

**Monetary Values**:
- **Always strings**: `"1.5"` not `1.5` (avoids floating-point issues)
- Use `ethers.parseEther()` for conversion to Wei
- Format: `"1.5"` for 1.5 ETH

**Time Values**:
- **Always seconds**: `duration: 86400` (not milliseconds)
- Unix timestamps: `startTime`, `endTime`

**IDs**:
- String or BigInt: `tokenId: "1"` or `tokenId: 1n`
- Listing/Auction IDs: `listingId`, `auctionId`, `offerId`, `bundleId`

### File Naming

- **Components/Classes**: PascalCase - `ZunoProvider.tsx`, `BaseModule.ts`
- **Hooks**: camelCase with `use` prefix - `useExchange.ts`
- **Utils**: camelCase - `errors.ts`, `helpers.ts`
- **Types**: camelCase - `config.ts`, `entities.ts`
- **Tests**: Match source with `.test.ts(x)` suffix

### Code Style

**Imports Order**:
1. External dependencies (React, ethers, etc.)
2. Internal absolute imports (types, utils)
3. Relative imports

**Comments**:
- Use JSDoc for public APIs
- Include `@param`, `@returns`, `@throws`, `@example`
- Inline comments for complex logic only

**Error Handling**:
- Always use `ZunoSDKError` class
- Include error code from `ErrorCodes` enum
- Provide helpful error messages
- Example:
  ```typescript
  throw new ZunoSDKError(
    ErrorCodes.MISSING_PROVIDER,
    'Signer is required. Please connect a wallet.'
  );
  ```

### TypeScript Patterns

**Type Exports**:
```typescript
// Export all types from a module
export type * from './types/config';

// Export specific types
export type { ZunoSDKConfig, NetworkType } from './types/config';
```

**Const Assertions**:
```typescript
const essentialContracts = [
  'ERC721NFTExchange',
  'ERC721CollectionFactory',
] as const;
```

**Type Guards**:
```typescript
function isNetworkString(network: NetworkType): network is string {
  return typeof network === 'string';
}
```

---

## Module Pattern

### Creating a New Module

1. **Extend BaseModule**:
   ```typescript
   // src/modules/NewFeatureModule.ts
   import { BaseModule } from './BaseModule';

   export class NewFeatureModule extends BaseModule {
     // Implementation
   }
   ```

2. **Add to ZunoSDK**:
   ```typescript
   // src/core/ZunoSDK.ts
   private _newFeature?: NewFeatureModule;

   get newFeature(): NewFeatureModule {
     if (!this._newFeature) {
       this._newFeature = new NewFeatureModule(
         this.apiClient,
         this.contractRegistry,
         this.queryClient,
         this.config.network,
         this.provider,
         this.signer
       );
     }
     return this._newFeature;
   }
   ```

3. **Export from main index**:
   ```typescript
   // src/index.ts
   export { NewFeatureModule } from './modules/NewFeatureModule';
   ```

### Module Method Pattern

```typescript
/**
 * Perform an action on the blockchain
 *
 * @param params - Action parameters
 * @returns Transaction receipt
 * @throws {ZunoSDKError} MISSING_PROVIDER - If signer not connected
 * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
 *
 * @example
 * ```typescript
 * const receipt = await sdk.module.performAction({
 *   collectionAddress: '0x...',
 *   tokenId: '1',
 * });
 * ```
 */
async performAction(params: ActionParams): Promise<TransactionReceipt> {
  // 1. Validate requirements
  const signer = this.ensureSigner();

  // 2. Get ABI
  const abi = await this.contractRegistry.getABI(
    'ContractType',
    this.getNetworkId()
  );

  // 3. Create contract instance
  const contract = new ethers.Contract(contractAddress, abi, signer);

  // 4. Execute transaction
  try {
    const tx = await contract.methodName(/* args */);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    throw this.error(
      ErrorCodes.TRANSACTION_FAILED,
      'Failed to perform action',
      error
    );
  }
}
```

---

## React Integration

### ZunoProvider Architecture

**Location**: `src/react/provider/ZunoProvider.tsx`

The `ZunoProvider` is an all-in-one wrapper that includes:

1. **WagmiProvider** - Blockchain connection (injected, WalletConnect, Coinbase)
2. **QueryClientProvider** - TanStack Query for caching
3. **ZunoContext** - SDK instance access
4. **ReactQueryDevtools** - Debug tools (dev mode only)

**Usage**:
```tsx
<ZunoProvider
  config={{
    apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
    network: 'sepolia',
    walletConnectProjectId: 'your-project-id', // Optional
  }}
  enableDevTools={true} // Optional, defaults to NODE_ENV === 'development'
>
  <App />
</ZunoProvider>
```

### Hook Patterns

#### Core Hook Structure

**Location**: `src/react/hooks/use*.ts`

All hooks follow this pattern:

```typescript
'use client'; // For Next.js App Router

import { useZuno } from '../provider/ZunoProvider';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useFeature() {
  const sdk = useZuno(); // Access SDK instance

  // Write operation (mutation)
  const performAction = useMutation({
    mutationFn: async (params: ActionParams) => {
      return await sdk.module.performAction(params);
    },
    onSuccess: (data) => {
      // Invalidate related queries
    },
    onError: (error) => {
      // Error handling
    },
  });

  // Read operation (query)
  const { data, isLoading, error } = useQuery({
    queryKey: ['feature', 'action'],
    queryFn: async () => {
      return await sdk.module.getData();
    },
  });

  return {
    performAction,
    data,
    isLoading,
    error,
  };
}
```

#### useWallet Hook

**Special Note**: Uses Wagmi's `useAccount`, `useConnect`, `useDisconnect`

```typescript
export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return {
    address,
    isConnected,
    connect: () => connect({ connector: connectors[0] }),
    disconnect,
    connectors,
  };
}
```

### Creating New Hooks

1. **Create hook file**: `src/react/hooks/useNewFeature.ts`
2. **Add "use client" directive** (for Next.js)
3. **Use `useZuno()` to access SDK**
4. **Use TanStack Query for async operations**
5. **Export from `src/react/index.ts`**
6. **Document with JSDoc**

Example:
```typescript
'use client';

import { useZuno } from '../provider/ZunoProvider';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for new feature operations
 */
export function useNewFeature() {
  const sdk = useZuno();

  const doSomething = useMutation({
    mutationFn: async (params) => {
      return await sdk.newFeature.doSomething(params);
    },
  });

  return { doSomething };
}
```

---

## Type System

### Core Type Files

**src/types/config.ts**:
- `ZunoSDKConfig` - Main SDK configuration
- `SDKOptions` - Initialization options
- `NetworkType` - Supported networks
- `RetryPolicy`, `CacheConfig`

**src/types/entities.ts**:
- Domain entities: `Listing`, `Auction`, `Collection`, `Offer`, `Bundle`
- Supporting types: `AuctionType`, `AuctionStatus`
- Blockchain types: `TransactionResponse`, `TransactionReceipt`
- `PaginatedResult<T>` - For paginated API responses

**src/types/contracts.ts**:
- Contract parameter types
- Contract operation types

**src/types/api.ts**:
- API request/response types
- Error response types

### Type Export Strategy

**Main Entry** (`src/index.ts`):
```typescript
export type * from './types/config';
export type * from './types/entities';
export type * from './types/api';
export type * from './types/contracts';
```

**React Entry** (`src/react/index.ts`):
```typescript
export type { ZunoProviderProps } from './provider/ZunoProvider';
// Individual hook types are exported with the hooks
```

### Common Type Patterns

**Optional Chaining for Blockchain Data**:
```typescript
interface Auction {
  startingBid?: string;    // Optional for Dutch auctions
  currentBid?: string;     // Optional until first bid
  highestBidder?: string;  // Optional until first bid
}
```

**Union Types for Status**:
```typescript
type AuctionStatus = 'active' | 'ended' | 'cancelled';
type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';
```

**Readonly for Configuration**:
```typescript
getConfig(): Readonly<ZunoSDKConfig> {
  return Object.freeze({ ...this.config });
}
```

---

## Testing Strategy

### Test Structure

**Location**: `src/__tests__/` (mirrors `src/` structure)

**Test Categories**:
1. **Core Tests** - SDK initialization, API client, contract registry
2. **Module Tests** - Individual module functionality
3. **React Hook Tests** - Hook behavior with React Testing Library
4. **Utility Tests** - Helper functions, error handling

### React Hook Testing Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExchange } from '../../react/hooks/useExchange';

describe('useExchange', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should list NFT successfully', async () => {
    const { result } = renderHook(() => useExchange(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Test implementation
  });
});
```

### Coverage Requirements

**Thresholds** (jest.config.js):
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**What to Test**:
- ✅ Public methods and hooks
- ✅ Error handling paths
- ✅ Edge cases (empty arrays, null values)
- ✅ Async operation success/failure
- ❌ Private methods (tested via public API)
- ❌ Type definitions (TypeScript handles this)

---

## Build & Distribution

### Build Configuration

**File**: `tsup.config.ts`

Two separate builds:

1. **Main SDK**:
   - Entry: `src/index.ts`
   - Output: `dist/index.{js,mjs,d.ts}`
   - Formats: CJS + ESM
   - External deps marked

2. **React Bundle**:
   - Entry: `src/react/index.ts`
   - Output: `dist/react/index.{js,mjs,d.ts}`
   - Formats: CJS + ESM
   - **Special**: `"use client"` banner added to all JS files

### Package.json Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js"
    }
  }
}
```

### Publishing Workflow

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Build package
npm run build

# 4. Test build locally
npm pack

# 5. Publish (runs prepublishOnly script automatically)
npm publish
```

**prepublishOnly Script**: Automatically runs `npm run build` before publishing

---

## Common Tasks

### Adding a New Module

1. Create module file: `src/modules/NewModule.ts`
2. Extend `BaseModule`
3. Add lazy getter to `ZunoSDK`
4. Export from `src/index.ts`
5. Update `ZunoSDK.updateProvider()` if needed
6. Add tests: `src/__tests__/modules/NewModule.test.ts`
7. Document in `docs/API.md`

### Adding a New Hook

1. Create hook file: `src/react/hooks/useNewFeature.ts`
2. Add `"use client"` directive
3. Use `useZuno()` to access SDK
4. Export from `src/react/index.ts`
5. Add tests: `src/__tests__/react/useNewFeature.test.tsx`
6. Update examples

### Adding a New Type

1. Determine category: config, entities, contracts, or api
2. Add to appropriate file in `src/types/`
3. Export from `src/types/index.ts` (if needed)
4. Export from main `src/index.ts` using `export type *`
5. Document with JSDoc comments

### Fixing a Bug

1. Write a failing test first (TDD)
2. Fix the bug
3. Ensure test passes
4. Check coverage: `npm test -- --coverage`
5. Update CHANGELOG.md
6. Commit with descriptive message

### Updating Dependencies

1. Check for breaking changes in library docs
2. Update package.json versions
3. Run `npm install`
4. Run full test suite: `npm test`
5. Run type check: `npm run type-check`
6. Test build: `npm run build`
7. Update code if needed for breaking changes

---

## Important Notes for AI Assistants

### 🚨 Critical Rules

1. **ALWAYS use `collectionAddress`** instead of `nftAddress` (breaking change in v1.0.2)
2. **NEVER use `any` type** without a good reason and `eslint-disable` comment
3. **ALWAYS add "use client"** directive to React component/hook files
4. **ALWAYS use string types** for monetary values (not numbers)
5. **ALWAYS extend `BaseModule`** for new feature modules
6. **ALWAYS use `ZunoSDKError`** for error handling (not generic Error)
7. **ALWAYS write tests** for new features (coverage threshold: 70%)
8. **NEVER bundle peer dependencies** (React, ethers, wagmi, viem)

### 📋 Checklist for New Features

- [ ] TypeScript types defined in `src/types/`
- [ ] Core module extends `BaseModule`
- [ ] JSDoc comments with `@param`, `@returns`, `@throws`, `@example`
- [ ] React hook uses `useZuno()` and has `"use client"`
- [ ] Tests written (unit + integration)
- [ ] Examples added to `examples/` directory
- [ ] Exported from appropriate index files
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] CHANGELOG.md updated
- [ ] docs/API.md updated

### 🔍 Common Pitfalls

**Pitfall #1: Forgetting to call `ensureSigner()`**
```typescript
// ❌ BAD - May crash if signer is undefined
async listNFT() {
  const contract = new ethers.Contract(address, abi, this.signer);
}

// ✅ GOOD - Validates signer exists
async listNFT() {
  const signer = this.ensureSigner();
  const contract = new ethers.Contract(address, abi, signer);
}
```

**Pitfall #2: Using numbers for prices**
```typescript
// ❌ BAD - Floating point issues
{ price: 1.5 }

// ✅ GOOD - String representation
{ price: "1.5" }
```

**Pitfall #3: Forgetting "use client" in React files**
```typescript
// ❌ BAD - Will cause Next.js App Router errors
export function useExchange() { ... }

// ✅ GOOD
'use client';
export function useExchange() { ... }
```

**Pitfall #4: Not handling TanStack Query cache invalidation**
```typescript
// ❌ BAD - Stale data after mutation
const listNFT = useMutation({
  mutationFn: async (params) => await sdk.exchange.listNFT(params),
});

// ✅ GOOD - Invalidate related queries
const listNFT = useMutation({
  mutationFn: async (params) => await sdk.exchange.listNFT(params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  },
});
```

**Pitfall #5: Using relative imports for types**
```typescript
// ❌ BAD - Use type exports
import { ZunoSDKConfig } from '../src/types/config';

// ✅ GOOD - Import from main entry
import type { ZunoSDKConfig } from 'zuno-marketplace-sdk';
```

### 🎯 Best Practices

1. **Lazy Loading**: Modules are lazy-loaded via getters (don't change this)
2. **Immutability**: Return frozen config objects (`Object.freeze`)
3. **Error Context**: Include module name in error messages
4. **Cache Strategy**: 5min stale, 10min GC for queries (configurable)
5. **Retry Logic**: 3 retries with exponential backoff (configurable)
6. **Type Safety**: Enable all strict TypeScript checks
7. **Modularity**: Each module is independent and can work standalone
8. **Documentation**: Every public API has JSDoc with examples

### 📚 Reference Documentation

- **API Reference**: `docs/API.md` - Complete API documentation
- **Migration Guide**: `docs/MIGRATION.md` - Upgrade instructions
- **Examples**: `examples/` - Working code samples
- **Changelog**: `CHANGELOG.md` - Version history with breaking changes

### 🔧 Development Tools

- **TypeScript**: Strict mode, target ES2020
- **Build**: tsup (esbuild) - Fast, dual CJS/ESM output
- **Test**: Jest with jsdom for React
- **Lint**: ESLint 9 flat config
- **Formatting**: Follow existing patterns (no Prettier config)

### 🌐 External Resources

- **Repository**: https://github.com/ZunoKit/zuno-marketplace-sdk
- **Issues**: https://github.com/ZunoKit/zuno-marketplace-sdk/issues
- **Wagmi Docs**: https://wagmi.sh
- **TanStack Query**: https://tanstack.com/query
- **ethers.js**: https://docs.ethers.org/v6/

---

## Version History

### v1.0.2 (Current)
- **Breaking**: Renamed `nftAddress` → `collectionAddress` across all modules
- Added comprehensive API documentation (`docs/API.md`)
- Added migration guide (`docs/MIGRATION.md`)
- Enhanced JSDoc comments

### v1.0.1
- Added runtime validation
- Batch operations support
- Error recovery mechanisms

### v0.1.x
- Initial release
- Core modules: Exchange, Collection, Auction
- React integration with 21+ hooks

---

**For questions or clarifications, refer to the codebase or documentation in `docs/` directory.**
