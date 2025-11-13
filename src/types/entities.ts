/**
 * Entity types
 * TODO: Implement according to PLAN.md
 */

export interface NFT {
  tokenId: string;
  tokenUri?: string;
  owner?: string;
}

export interface Collection {
  address: string;
  name?: string;
  symbol?: string;
}

export interface Listing {
  listingId: string;
  seller: string;
  price: string;
}
