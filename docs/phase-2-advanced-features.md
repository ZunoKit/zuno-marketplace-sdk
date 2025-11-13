# Phase 2: Advanced Features (Weeks 3-4)

## Objectives

Implement advanced marketplace features: Auctions, Offers, and Bundles.

## Tasks

- ⏳ Implement AuctionModule (English & Dutch)
- ⏳ Implement OfferModule
- ⏳ Implement BundleModule
- ⏳ Add event listening capabilities
- ⏳ Add transaction management utilities
- ⏳ Implement advanced caching strategies
- ⏳ Write integration tests with mock API

## Deliverables

- All modules implemented
- Event system working
- Integration tests passing

---

## Implementation Details

### 1. AuctionModule

File: `src/modules/AuctionModule.ts`

```typescript
export class AuctionModule extends BaseModule {
  // Create English auction
  async createEnglishAuction(params: {
    nftAddress: string;
    tokenId: string;
    startingBid: string;
    duration: number;
    reservePrice?: string;
  }): Promise<{ auctionId: string; tx: TransactionResponse }>

  // Create Dutch auction
  async createDutchAuction(params: {
    nftAddress: string;
    tokenId: string;
    startPrice: string;
    endPrice: string;
    duration: number;
  }): Promise<{ auctionId: string; tx: TransactionResponse }>

  // Place bid
  async placeBid(auctionId: string, amount: string): Promise<TransactionResponse>

  // End auction
  async endAuction(auctionId: string): Promise<TransactionResponse>

  // Get auction details
  async getAuction(auctionId: string): Promise<Auction>

  // Event listening
  on(event: 'AuctionCreated' | 'BidPlaced' | 'AuctionEnded', callback: (event: any) => void): void
}
```

### 2. OfferModule

File: `src/modules/OfferModule.ts`

```typescript
export class OfferModule extends BaseModule {
  // Make offer on specific NFT
  async makeOffer(params: {
    nftAddress: string;
    tokenId: string;
    price: string;
    duration: number;
  }): Promise<{ offerId: string; tx: TransactionResponse }>

  // Make collection offer
  async makeCollectionOffer(params: {
    collectionAddress: string;
    price: string;
    duration: number;
  }): Promise<{ offerId: string; tx: TransactionResponse }>

  // Accept offer
  async acceptOffer(offerId: string): Promise<TransactionResponse>

  // Cancel offer
  async cancelOffer(offerId: string): Promise<TransactionResponse>

  // Get offer details
  async getOffer(offerId: string): Promise<Offer>
}
```

### 3. BundleModule

File: `src/modules/BundleModule.ts`

```typescript
export class BundleModule extends BaseModule {
  // Create bundle
  async createBundle(params: {
    nfts: Array<{ address: string; tokenId: string }>;
    price: string;
    duration: number;
  }): Promise<{ bundleId: string; tx: TransactionResponse }>

  // Buy bundle
  async buyBundle(bundleId: string, value?: string): Promise<TransactionResponse>

  // Cancel bundle
  async cancelBundle(bundleId: string): Promise<TransactionResponse>

  // Get bundle details
  async getBundle(bundleId: string): Promise<Bundle>
}
```

### 4. Event System

File: `src/utils/events.ts`

```typescript
export class EventEmitter {
  private events: Map<string, Set<Function>>;

  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  emit(event: string, data: any): void
}

// Usage in modules
sdk.auction.on('BidPlaced', (event) => {
  console.log('New bid:', event);
});
```

### 5. Transaction Management

File: `src/utils/transactions.ts`

```typescript
export interface TransactionOptions {
  gasLimit?: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  waitForConfirmations?: number;
  onSent?: (tx: TransactionResponse) => void;
  onConfirmed?: (receipt: TransactionReceipt) => void;
}

export class TransactionManager {
  async sendTransaction(
    contract: ethers.Contract,
    method: string,
    args: any[],
    options?: TransactionOptions
  ): Promise<TransactionReceipt>
}
```

## Testing

```typescript
// tests/integration/modules/AuctionModule.test.ts
describe('AuctionModule Integration', () => {
  it('should create English auction and place bid', async () => {
    const result = await sdk.auction.createEnglishAuction({
      nftAddress: '0x...',
      tokenId: '1',
      startingBid: ethers.parseEther('1').toString(),
      duration: 86400,
    });

    expect(result.auctionId).toBeDefined();

    const bidTx = await sdk.auction.placeBid(
      result.auctionId,
      ethers.parseEther('1.5').toString()
    );

    expect(bidTx).toBeDefined();
  });
});
```

## Success Criteria

- [ ] AuctionModule with English & Dutch auctions implemented
- [ ] OfferModule with NFT and collection offers implemented
- [ ] BundleModule implemented
- [ ] Event listening system working
- [ ] Transaction management utilities working
- [ ] Integration tests passing
- [ ] Documentation complete

## Next Phase

After completing Phase 2, move to [Phase 3: React Integration](./phase-3-react-integration.md)
