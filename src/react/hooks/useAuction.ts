/**
 * Auction hooks for English and Dutch auctions
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoContextProvider';

/**
 * Settle auction parameters
 */
export interface SettleAuctionParams {
  auctionId: string;
  options?: TransactionOptions;
}

/**
 * Hook for auction operations
 */
export function useAuction() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createEnglishAuction = useMutation({
    mutationFn: (params: CreateEnglishAuctionParams) =>
      sdk.auction.createEnglishAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const createDutchAuction = useMutation({
    mutationFn: (params: CreateDutchAuctionParams) =>
      sdk.auction.createDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const placeBid = useMutation({
    mutationFn: (params: PlaceBidParams) => sdk.auction.placeBid(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const settleAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.settleAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const buyNow = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.buyNow(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const withdrawBid = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.withdrawBid(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
    },
  });

  const cancelAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.cancelAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  return {
    createEnglishAuction,
    createDutchAuction,
    placeBid,
    settleAuction,
    buyNow,
    withdrawBid,
    cancelAuction,
  };
}

/**
 * Hook to fetch auction details
 */
export function useAuctionDetails(auctionId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => sdk.auction.getAuction(auctionId!),
    enabled: !!auctionId,
  });
}

/**
 * Hook to get current Dutch auction price
 */
export function useDutchAuctionPrice(auctionId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['dutchAuctionPrice', auctionId],
    queryFn: () => sdk.auction.getCurrentPrice(auctionId!),
    enabled: !!auctionId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to fetch active auctions
 */
export function useActiveAuctions(page = 1, pageSize = 20) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['auctions', 'active', page, pageSize],
    queryFn: () => sdk.auction.getActiveAuctions(page, pageSize),
  });
}

/**
 * Hook to fetch auctions by seller
 */
export function useAuctionsBySeller(seller?: string, page = 1, pageSize = 20) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['auctions', 'seller', seller, page, pageSize],
    queryFn: () => sdk.auction.getAuctionsBySeller(seller!, page, pageSize),
    enabled: !!seller,
  });
}
