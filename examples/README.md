# Zuno Marketplace SDK - Examples

This folder contains practical examples of using the Zuno Marketplace SDK.

## Files

### `basic-usage.ts`
Shows how to use the core SDK functions:
- List NFT
- Buy NFT
- Mint NFT
- Create Auction
- Batch Operations

**Run:**
```bash
npm run basic
```

### `react-example.tsx`
Demonstrates React integration with:
- ZunoProvider setup
- React hooks usage
- Error handling
- Loading states

**Usage:**
```tsx
import App from './react-example';
```

## MVP Features Covered

### ✅ Exchange Module
- `listNFT()` - List single NFT
- `batchListNFT()` - List multiple NFTs
- `buyNFT()` - Buy NFT
- `batchBuyNFT()` - Buy multiple NFTs
- `cancelListing()` - Cancel listing
- `batchCancelListing()` - Cancel multiple listings

### ✅ Collection Module
- `mintERC721()` - Mint single NFT
- `batchMintERC721()` - Mint multiple NFTs

### ✅ Auction Module
- `createEnglishAuction()` - Create English auction
- `createDutchAuction()` - Create Dutch auction

## Quick Setup

```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk';

const sdk = new ZunoSDK({
  apiKey: 'your-api-key',
  network: 'sepolia',
  abisUrl: 'https://abis.zuno.com/api',
});
```

## React Setup

```tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

<ZunoProvider config={{ apiKey: 'your-key', network: 'sepolia' }}>
  <YourApp />
</ZunoProvider>
```