# Zuno Marketplace SDK

**✨ All-in-One NFT Marketplace SDK với Wagmi & React Query đóng gói sẵn!**

[![npm version](https://img.shields.io/npm/v/zuno-marketplace-sdk.svg)](https://www.npmjs.com/package/zuno-marketplace-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Một TypeScript SDK hoàn chỉnh để tương tác với Zuno Marketplace smart contracts. Wagmi và React Query đã được tích hợp sẵn - không cần config gì thêm!

## 🚀 Quick Start (30 giây)

### 1. Installation

**Chỉ cần 1 package duy nhất:**

```bash
npm install zuno-marketplace-sdk

# hoặc
yarn add zuno-marketplace-sdk

# hoặc
pnpm add zuno-marketplace-sdk
```

### 2. Setup (Chỉ 1 Provider!)

```tsx
// app/layout.tsx
'use client';

import { ZunoProvider } from 'zuno-marketplace-sdk/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
```

### 3. Use Hooks

```tsx
// components/MintNFT.tsx
import { useCollection, useWallet } from 'zuno-marketplace-sdk/react';

export function MintNFT() {
  const { mintERC721 } = useCollection();
  const { address } = useWallet();

  const handleMint = async () => {
    await mintERC721.mutateAsync({
      collectionAddress: '0x...',
      recipient: address,
      tokenUri: 'ipfs://...',
    });
  };

  return <button onClick={handleMint}>Mint NFT</button>;
}
```

**Xong! Không cần config Wagmi, React Query, hay bất cứ thứ gì khác!** 🎉

## ✨ Features

- ✅ **All-in-One Package** - Wagmi + React Query + SDK trong 1 package
- ✅ **Zero Config** - Không cần setup Wagmi hay React Query
- ✅ **TypeScript First** - Full type safety
- ✅ **Dynamic ABI Fetching** - Load ABIs from registry on-demand
- ✅ **Smart Caching** - TanStack Query với automatic caching
- ✅ **Modular** - Exchange, Collection, Auction, Offers, Bundles
- ✅ **React Hooks** - Comprehensive hooks cho mọi tính năng
- ✅ **Multi-network** - Mainnet, Sepolia, Polygon, Arbitrum
- ✅ **Event Listening** - Subscribe to contract events

## 📦 What's Included

### Core Modules

- **ExchangeModule** - Marketplace trading (list, buy, cancel)
- **CollectionModule** - NFT collections & minting (ERC721, ERC1155)
- **AuctionModule** - English & Dutch auctions
- **OfferModule** - Make & accept offers
- **BundleModule** - Multi-NFT bundle trading

### React Hooks

- **useExchange** - Trading operations
- **useCollection** - Collection management & minting
- **useAuction** - Auction operations
- **useOffers** - Offer management
- **useBundles** - Bundle operations
- **useWallet** - Wallet connection
- **useABI** - ABI management with caching

### Built-in Dependencies

- ✅ Wagmi v2 (với connectors: MetaMask, WalletConnect, Coinbase)
- ✅ TanStack Query v5
- ✅ Viem v2
- ✅ Ethers v6

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./examples)
- [Phase 1 - Core SDK](./docs/phase-1-core-sdk.md)
- [Phase 2 - Advanced Features](./docs/phase-2-advanced-features.md)
- [Phase 3 - React Integration](./docs/phase-3-react-integration.md)

## 🎯 Comparison

### Traditional Way ❌

```bash
# Install 5+ packages
npm install your-sdk wagmi viem @tanstack/react-query @wagmi/core @wagmi/connectors
```

```tsx
// Setup 3 providers + manual config
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <YourProvider config={config}>
      {children}
    </YourProvider>
  </QueryClientProvider>
</WagmiProvider>
```

### Zuno SDK Way ✅

```bash
# Install 1 package
npm install zuno-marketplace-sdk
```

```tsx
// Setup 1 provider
<ZunoProvider config={{ apiKey: '...', network: 'sepolia' }}>
  {children}
</ZunoProvider>
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 📄 License

MIT © Zuno Team

## 🆘 Support

- [GitHub Issues](https://github.com/ZunoKit/zuno-marketplace-sdk/issues)
- [Documentation](./docs)
- Email: support@zuno.com
