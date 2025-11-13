/**
 * Auction Module for managing English and Dutch auctions
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../types/contracts';
import type { Auction, TransactionReceipt } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../utils/errors';

/**
 * AuctionModule handles auction creation and bidding
 */
export class AuctionModule extends BaseModule {
  /**
   * Create an English auction
   */
  async createEnglishAuction(
    params: CreateEnglishAuctionParams
  ): Promise<{ auctionId: string; tx: TransactionReceipt }> {
    const {
      nftAddress,
      tokenId,
      amount = 1,
      startingBid,
      duration,
      reservePrice,
      seller,
      options,
    } = params;

    validateAddress(nftAddress, 'nftAddress');
    validateTokenId(tokenId);
    validateAmount(startingBid, 'startingBid');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startingBidWei = ethers.parseEther(startingBid);
    const reservePriceWei = reservePrice
      ? ethers.parseEther(reservePrice)
      : 0n;

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Contract expects: (address, uint256, uint256, uint256, uint256, uint256, AuctionType, address)
    const receipt = await txManager.sendTransaction(
      auctionContract,
      'createAuction',
      [
        nftAddress,
        tokenId,
        amount,
        startingBidWei,
        reservePriceWei,
        duration,
        0, // AuctionType.ENGLISH = 0
        sellerAddress,
      ],
      options
    );

    // Extract auction ID from logs
    const auctionId = await this.extractAuctionId(receipt);

    return { auctionId, tx: receipt };
  }

  /**
   * Create a Dutch auction
   */
  async createDutchAuction(
    params: CreateDutchAuctionParams
  ): Promise<{ auctionId: string; tx: TransactionReceipt }> {
    const {
      nftAddress,
      tokenId,
      amount = 1,
      startPrice,
      endPrice,
      duration,
      seller,
      options,
    } = params;

    validateAddress(nftAddress, 'nftAddress');
    validateTokenId(tokenId);
    validateAmount(startPrice, 'startPrice');
    validateAmount(endPrice, 'endPrice');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startPriceWei = ethers.parseEther(startPrice);
    const endPriceWei = ethers.parseEther(endPrice);

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Contract expects: (address, uint256, uint256, uint256, uint256, uint256, AuctionType, address)
    // Note: endPrice maps to reservePrice parameter in contract
    const receipt = await txManager.sendTransaction(
      auctionContract,
      'createAuction',
      [
        nftAddress,
        tokenId,
        amount,
        startPriceWei,
        endPriceWei, // maps to reservePrice in contract
        duration,
        1, // AuctionType.DUTCH = 1
        sellerAddress,
      ],
      options
    );

    // Extract auction ID from logs
    const auctionId = await this.extractAuctionId(receipt);

    return { auctionId, tx: receipt };
  }

  /**
   * Place a bid on an English auction
   */
  async placeBid(params: PlaceBidParams): Promise<TransactionReceipt> {
    const { auctionId, amount, options } = params;

    validateTokenId(auctionId, 'auctionId');
    validateAmount(amount, 'amount');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const amountWei = ethers.parseEther(amount);

    // Place bid with ETH value
    return await txManager.sendTransaction(
      auctionContract,
      'placeBid',
      [auctionId],
      {
        ...options,
        value: amountWei.toString(),
      }
    );
  }

  /**
   * End an auction
   */
  async endAuction(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Try English auction first
    try {
      const auctionContract = await this.contractRegistry.getContract(
        'EnglishAuction',
        this.getNetworkId(),
        provider,
        undefined,
        this.signer
      );

      return await txManager.sendTransaction(
        auctionContract,
        'endAuction',
        [auctionId],
        options
      );
    } catch {
      // Try Dutch auction
      const auctionContract = await this.contractRegistry.getContract(
        'DutchAuction',
        this.getNetworkId(),
        provider,
        undefined,
        this.signer
      );

      return await txManager.sendTransaction(
        auctionContract,
        'endAuction',
        [auctionId],
        options
      );
    }
  }

  /**
   * Get auction details
   */
  async getAuction(auctionId: string): Promise<Auction> {
    validateTokenId(auctionId, 'auctionId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    // Try English auction first
    try {
      const auctionContract = await this.contractRegistry.getContract(
        'EnglishAuction',
        this.getNetworkId(),
        provider
      );

      const auction = await txManager.callContract<unknown[]>(
        auctionContract,
        'getAuction',
        [auctionId]
      );

      return this.formatAuction(auctionId, auction, 'english');
    } catch {
      // Try Dutch auction
      const auctionContract = await this.contractRegistry.getContract(
        'DutchAuction',
        this.getNetworkId(),
        provider
      );

      const auction = await txManager.callContract<unknown[]>(
        auctionContract,
        'getAuction',
        [auctionId]
      );

      return this.formatAuction(auctionId, auction, 'dutch');
    }
  }

  /**
   * Get current price for Dutch auction
   */
  async getCurrentPrice(auctionId: string): Promise<string> {
    validateTokenId(auctionId, 'auctionId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuction',
      this.getNetworkId(),
      provider
    );

    const price = await txManager.callContract<bigint>(
      auctionContract,
      'getCurrentPrice',
      [auctionId]
    );

    return ethers.formatEther(price);
  }

  /**
   * Extract auction ID from transaction receipt
   */
  private async extractAuctionId(receipt: TransactionReceipt): Promise<string> {
    for (const log of receipt.logs) {
      try {
        const logData = log as any; // Type assertion for event log
        if (logData.topics && logData.topics.length > 1) {
          const auctionIdHex = logData.topics[1];
          const auctionId = ethers.toBigInt(auctionIdHex);
          return auctionId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      'CONTRACT_CALL_FAILED',
      'Could not extract auction ID from transaction'
    );
  }

  /**
   * Format raw auction data
   */
  private formatAuction(
    id: string,
    data: unknown[],
    type: 'english' | 'dutch'
  ): Auction {
    const [
      seller,
      nftAddress,
      tokenId,
      startPrice,
      endPrice,
      currentBid,
      highestBidder,
      startTime,
      endTime,
      status,
    ] = data as [
      string,
      string,
      bigint,
      bigint,
      bigint,
      bigint,
      string,
      bigint,
      bigint,
      number,
    ];

    const statusMap: Record<number, Auction['status']> = {
      0: 'active',
      1: 'ended',
      2: 'cancelled',
    };

    const auction: Auction = {
      id,
      type,
      seller,
      nftAddress,
      tokenId: tokenId.toString(),
      startTime: Number(startTime),
      endTime: Number(endTime),
      status: statusMap[status] || 'active',
      createdAt: new Date(Number(startTime) * 1000).toISOString(),
    };

    if (type === 'english') {
      auction.startingBid = ethers.formatEther(startPrice);
      auction.currentBid = ethers.formatEther(currentBid);
      auction.highestBidder = highestBidder;
    } else {
      auction.startPrice = ethers.formatEther(startPrice);
      auction.endPrice = ethers.formatEther(endPrice);
    }

    return auction;
  }
}
