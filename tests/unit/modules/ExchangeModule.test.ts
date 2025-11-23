/**
 * ExchangeModule Unit Tests
 */

import { ExchangeModule } from '../../../src/modules/ExchangeModule';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/core/ZunoAPIClient');
jest.mock('../../../src/core/ContractRegistry');

describe('ExchangeModule', () => {
  let module: ExchangeModule;
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

    module = new ExchangeModule(
      'sepolia',
      mockProvider,
      mockSigner,
      mockAPIClient,
      mockContractRegistry,
      queryClient
    );
  });

  describe('listNFT', () => {
    it('should validate parameters', async () => {
      await expect(
        module.listNFT({
          collectionAddress: 'invalid-address',
          tokenId: '1',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error if no signer is set', async () => {
      const moduleWithoutSigner = new ExchangeModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate price is positive', async () => {
      await expect(
        module.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate duration is positive', async () => {
      await expect(
        module.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '1.0',
          duration: 0,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate token ID is valid', async () => {
      await expect(
        module.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('cancelListing', () => {
    it('should validate listing ID', async () => {
      await expect(
        module.cancelListing({ listingId: '' })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new ExchangeModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.cancelListing({ listingId: '1' })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('buyNFT', () => {
    it('should validate listing ID', async () => {
      await expect(
        module.buyNFT({ listingId: '' })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new ExchangeModule(
        'sepolia',
        mockProvider,
        undefined,
        mockAPIClient,
        mockContractRegistry,
        queryClient
      );

      await expect(
        moduleWithoutSigner.buyNFT({ listingId: '1' })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('parameter normalization', () => {
    it('should handle string token IDs', async () => {
      // Test that token IDs are properly handled as strings
      const params = {
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '123',
        price: '1.0',
        duration: 86400,
      };

      // This should not throw for valid string token ID
      try {
        await module.listNFT(params);
      } catch (error) {
        // We expect it to fail on contract call, not validation
        expect(error).not.toBeInstanceOf(TypeError);
      }
    });

    it('should handle price as ETH string', async () => {
      const params = {
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.5',
        duration: 86400,
      };

      try {
        await module.listNFT(params);
      } catch (error) {
        // Should not fail on price format
        if (error instanceof ZunoSDKError) {
          expect(error.code).not.toBe(ErrorCodes.INVALID_AMOUNT);
        }
      }
    });
  });
});
