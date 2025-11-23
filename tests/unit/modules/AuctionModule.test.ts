/**
 * AuctionModule Unit Tests
 */

import { AuctionModule } from '../../../src/modules/AuctionModule';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';

// Mock axios to prevent real network calls
jest.mock('axios');

// Mock dependencies
jest.mock('../../../src/core/ZunoAPIClient');
jest.mock('../../../src/core/ContractRegistry');

describe('AuctionModule', () => {
  let module: AuctionModule;
  let mockProvider: ethers.Provider;
  let mockSigner: ethers.Signer;
  let mockAPIClient: jest.Mocked<ZunoAPIClient>;
  let mockContractRegistry: jest.Mocked<ContractRegistry>;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockProvider = new ethers.JsonRpcProvider('http://localhost:8545');
    mockSigner = new ethers.Wallet(
      '0x1234567890123456789012345678901234567890123456789012345678901234',
      mockProvider
    );

    mockAPIClient = {
      getContractInfo: jest.fn(),
    } as unknown as jest.Mocked<ZunoAPIClient>;

    mockContractRegistry = {
      getContract: jest.fn().mockRejectedValue(new Error('Mock contract error')),
      prefetchABIs: jest.fn(),
      getABI: jest.fn(),
      clearCache: jest.fn(),
    } as unknown as jest.Mocked<ContractRegistry>;

    module = new AuctionModule(
      'sepolia',
      mockProvider,
      mockSigner,
      mockAPIClient,
      mockContractRegistry,
      queryClient
    );
  });

  describe('createEnglishAuction', () => {
    it('should validate collection address', async () => {
      await expect(
        module.createEnglishAuction({
          collectionAddress: 'invalid-address',
          tokenId: '1',
          startingBid: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new AuctionModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.createEnglishAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingBid: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate starting bid is positive', async () => {
      await expect(
        module.createEnglishAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingBid: '0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate duration is positive', async () => {
      await expect(
        module.createEnglishAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingBid: '1.0',
          duration: 0,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('createDutchAuction', () => {
    it('should validate collection address', async () => {
      await expect(
        module.createDutchAuction({
          collectionAddress: 'invalid',
          tokenId: '1',
          startingPrice: '10.0',
          endingPrice: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate starting price > ending price', async () => {
      await expect(
        module.createDutchAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingPrice: '1.0',
          endingPrice: '10.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate both prices are positive', async () => {
      await expect(
        module.createDutchAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingPrice: '0',
          endingPrice: '0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('placeBid', () => {
    it('should validate auction ID', async () => {
      await expect(
        module.placeBid({
          auctionId: '',
          bidAmount: '1.0',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate bid amount is positive', async () => {
      await expect(
        module.placeBid({
          auctionId: '1',
          bidAmount: '0',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new AuctionModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.placeBid({
          auctionId: '1',
          bidAmount: '1.0',
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('cancelAuction', () => {
    it('should validate auction ID', async () => {
      await expect(
        module.cancelAuction({ auctionId: '' })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new AuctionModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.cancelAuction({ auctionId: '1' })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('settleAuction', () => {
    it('should validate auction ID', async () => {
      await expect(
        module.settleAuction({ auctionId: '' })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new AuctionModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.settleAuction({ auctionId: '1' })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('parameter consistency', () => {
    it('should use collectionAddress consistently', async () => {
      const params = {
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        startingBid: '1.0',
        duration: 86400,
      };

      try {
        await module.createEnglishAuction(params);
      } catch (error) {
        // Should not fail on parameter naming
        if (error instanceof Error) {
          expect(error.message).not.toContain('nftAddress');
        }
      }
    });
  });
});
