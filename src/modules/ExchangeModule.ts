/**
 * Exchange Module for NFT marketplace trading operations
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  ListNFTParams,
  BuyNFTParams,
  BatchBuyNFTParams,
  BatchCancelListingParams,
  TransactionOptions,
} from '../types/contracts';
import type {
  Listing,
  TransactionReceipt,
} from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateListNFTParams,
} from '../utils/errors';
import { ZunoSDKError, ErrorCodes } from '../utils/errors';

/**
 * ExchangeModule handles marketplace trading operations
 */
export class ExchangeModule extends BaseModule {
  /**
   * Ensure NFT collection is approved for Exchange contract
   * Checks approval status and approves if needed
   */
  private async ensureApproval(
    collectionAddress: string,
    ownerAddress: string
  ): Promise<void> {
    const provider = this.ensureProvider();
    const signer = this.ensureSigner();

    // Get Exchange contract address
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );
    const operatorAddress = await exchangeContract.getAddress();

    // Check if already approved
    const erc721Abi = [
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function setApprovalForAll(address operator, bool approved)',
    ];
    const nftContract = new ethers.Contract(collectionAddress, erc721Abi, signer);

    const isApproved = await nftContract.isApprovedForAll(ownerAddress, operatorAddress);

    if (!isApproved) {
      const tx = await nftContract.setApprovalForAll(operatorAddress, true);
      await tx.wait();
    }
  }

  /**
   * List an NFT for sale
   */
  async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
    // Runtime validation
    validateListNFTParams(params);

    const { collectionAddress, tokenId, price, duration, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get seller address
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    // Ensure NFT is approved for Exchange
    await this.ensureApproval(collectionAddress, sellerAddress);

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare parameters - contract expects: (address, uint256, uint256, uint256)
    const priceInWei = ethers.parseEther(price);

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'listNFT',
      [collectionAddress, tokenId, priceInWei, duration],
      { ...options, module: 'Exchange' }
    );

    // Extract listing ID from transaction logs
    const listingId = await this.extractListingId(tx);

    return { listingId, tx };
  }

  
  /**
   * Buy an NFT from a listing
   */
  async buyNFT(params: BuyNFTParams): Promise<{ tx: TransactionReceipt }> {
    const { listingId, value, options } = params;

    validateTokenId(listingId, 'listingId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare transaction options with value
    const txOptions: TransactionOptions = {
      ...options,
      value: value || options?.value,
    };

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'buyNFT',
      [listingId],
      { ...txOptions, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Batch buy multiple NFTs from listings
   */
  async batchBuyNFT(params: BatchBuyNFTParams): Promise<{ tx: TransactionReceipt }> {
    const { listingIds, value, options } = params;

    if (listingIds.length === 0) {
      throw new Error('Listing IDs array cannot be empty');
    }

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare transaction options with value
    const txOptions: TransactionOptions = {
      ...options,
      value: value || options?.value,
    };

    // Call contract method - contract expects: (bytes32[])
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchBuyNFT',
      [listingIds],
      { ...txOptions, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Cancel an NFT listing
   */
  async cancelListing(
    listingId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    validateTokenId(listingId, 'listingId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'cancelListing',
      [listingId],
      { ...options, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Batch cancel multiple NFT listings
   */
  async batchCancelListing(
    params: BatchCancelListingParams
  ): Promise<{ tx: TransactionReceipt }> {
    const { listingIds, options } = params;

    if (listingIds.length === 0) {
      throw new Error('Listing IDs array cannot be empty');
    }

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Call contract method - contract expects: (bytes32[])
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchCancelListing',
      [listingIds],
      { ...options, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Get listing details
   */
  async getListing(listingId: string): Promise<Listing> {
    validateTokenId(listingId, 'listingId');

    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();

    // Call contract to get listing (s_listings is a public mapping)
    const listing = await txManager.callContract<unknown[]>(
      exchangeContract,
      's_listings',
      [listingId]
    );

    // Format the response
    return this.formatListing(listingId, listing);
  }

  /**
   * Get listings by collection
   */
  async getListings(collectionAddress: string): Promise<Listing[]> {
    validateAddress(collectionAddress);

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsByCollection',
      [collectionAddress]
    );

    return Promise.all(listingIds.map((id) => this.getListing(id)));
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(seller: string): Promise<Listing[]> {
    validateAddress(seller, 'seller');

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsBySeller',
      [seller]
    );

    return Promise.all(listingIds.map((id) => this.getListing(id)));
  }

  /**
   * Format raw listing data from contract
   */
  private formatListing(id: string, data: unknown): Listing {
    // Contract returns Result object with named properties matching struct fields
    const listing = data as {
      contractAddress: string;
      tokenId: bigint;
      price: bigint;
      seller: string;
      listingDuration: bigint;
      listingStart: bigint;
      status: bigint;
      amount: bigint;
    };

    // Contract enum: 0=Pending, 1=Active, 2=Sold, 3=Failed, 4=Cancelled
    const statusMap: Record<number, Listing['status']> = {
      0: 'pending',
      1: 'active',
      2: 'sold',
      3: 'expired', // Failed maps to expired
      4: 'cancelled',
    };

    const startTime = Number(listing.listingStart);
    const endTime = startTime + Number(listing.listingDuration);

    return {
      id,
      seller: listing.seller,
      collectionAddress: listing.contractAddress,
      tokenId: listing.tokenId.toString(),
      price: ethers.formatEther(listing.price),
      paymentToken: ethers.ZeroAddress,
      startTime,
      endTime,
      status: statusMap[Number(listing.status)] || 'active',
      createdAt: new Date(startTime * 1000).toISOString(),
    };
  }

  /**
   * Batch list multiple NFTs using the batchExecute utility
   */
  async batchListNFT(
    paramsArray: ListNFTParams[],
    options?: { continueOnError?: boolean; maxConcurrency?: number }
  ): Promise<Array<{ success: boolean; data?: { listingId: string; tx: TransactionReceipt }; error?: ZunoSDKError }>> {
    if (!paramsArray.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Parameters array cannot be empty');
    }

    const operations = paramsArray.map(params => () => this.listNFT(params));

    return this.batchExecute(operations, {
      continueOnError: options?.continueOnError ?? true,
      maxConcurrency: options?.maxConcurrency ?? 3
    });
  }

  /**
   * Extract listing ID from transaction receipt logs
   * Returns bytes32 hex format (needed for cancel/buy operations)
   */
  private async extractListingId(receipt: TransactionReceipt): Promise<string> {
    // Look for ListingCreated event in logs
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 1) {
          // Listing ID is bytes32, return as hex directly
          return log.topics[1];
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      ErrorCodes.CONTRACT_CALL_FAILED,
      'Could not extract listing ID from transaction'
    );
  }
}
