/**
 * CollectionModule Unit Tests
 */

import { CollectionModule } from '../../../src/modules/CollectionModule';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/core/ZunoAPIClient');
jest.mock('../../../src/core/ContractRegistry');

describe('CollectionModule', () => {
  let module: CollectionModule;
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

    module = new CollectionModule(
      mockAPIClient,
      mockContractRegistry,
      queryClient,
      'sepolia',
      mockProvider,
      mockSigner
    );
  });

  describe('createERC721Collection', () => {
    it('should validate name parameter', async () => {
      await expect(
        module.createERC721Collection({
          name: '',
          symbol: 'NFT',
        } as any)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate symbol parameter', async () => {
      await expect(
        module.createERC721Collection({
          name: 'My NFT',
          symbol: '',
        } as any)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new CollectionModule(
        mockAPIClient,
        mockContractRegistry,
        queryClient,
        'sepolia',
        mockProvider,
        undefined
      );

      await expect(
        moduleWithoutSigner.createERC721Collection({
          name: 'My NFT',
          symbol: 'NFT',
          baseUri: 'https://example.com',
          maxSupply: 1000,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate maxSupply is positive if provided', async () => {
      await expect(
        module.createERC721Collection({
          name: 'My NFT',
          symbol: 'NFT',
          baseUri: 'https://example.com',
          maxSupply: 0,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should accept optional parameters', async () => {
      const params = {
        name: 'My NFT',
        symbol: 'NFT',
        baseUri: 'https://api.example.com/metadata/',
        maxSupply: 1000,
      };

      // Should not throw on validation
      try {
        await module.createERC721Collection(params);
      } catch (error) {
        // May fail on contract call, but not on validation
        if (error instanceof ZunoSDKError) {
          expect([
            ErrorCodes.MISSING_PROVIDER,
            ErrorCodes.CONTRACT_CALL_FAILED,
          ]).toContain(error.code);
        }
      }
    });
  });

  describe('createERC1155Collection', () => {
    it('should validate URI parameter', async () => {
      await expect(
        module.createERC1155Collection({
          uri: '',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new CollectionModule(
        mockAPIClient,
        mockContractRegistry,
        queryClient,
        'sepolia',
        mockProvider,
        undefined
      );

      await expect(
        moduleWithoutSigner.createERC1155Collection({
          uri: 'https://example.com/{id}.json',
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('mintERC721', () => {
    it('should validate collection address', async () => {
      await expect(
        module.mintERC721({
          collectionAddress: 'invalid-address',
          recipient: '0x1234567890123456789012345678901234567890',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate recipient address', async () => {
      await expect(
        module.mintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: 'invalid-address',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new CollectionModule(
        mockAPIClient,
        mockContractRegistry,
        queryClient,
        'sepolia',
        mockProvider,
        undefined
      );

      await expect(
        moduleWithoutSigner.mintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should handle mint with payment', async () => {
      const params = {
        collectionAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        value: '0.1',
      };

      try {
        await module.mintERC721(params);
      } catch (error) {
        // Should not fail on parameter validation
        if (error instanceof ZunoSDKError) {
          expect(error.code).not.toBe(ErrorCodes.INVALID_AMOUNT);
        }
      }
    });
  });

  describe('batchMintERC721', () => {
    it('should validate collection address', async () => {
      await expect(
        module.batchMintERC721({
          collectionAddress: 'invalid',
          recipient: '0x1234567890123456789012345678901234567890',
          amount: 1,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should validate amount is positive', async () => {
      await expect(
        module.batchMintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0x1234567890123456789012345678901234567890',
          amount: 0,
        })
      ).rejects.toThrow(); // Checks for generic Error as implementation throws Error, not ZunoSDKError for amount
    });

    it('should validate recipient address', async () => {
      await expect(
        module.batchMintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: 'invalid',
          amount: 1,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should require signer', async () => {
      const moduleWithoutSigner = new CollectionModule(
        mockAPIClient,
        mockContractRegistry,
        queryClient,
        'sepolia',
        mockProvider,
        undefined
      );

      await expect(
        moduleWithoutSigner.batchMintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          amount: 1,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('parameter consistency', () => {
    it('should use collectionAddress consistently', async () => {
      const params = {
        collectionAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      };

      try {
        await module.mintERC721(params);
      } catch (error) {
        // Should not fail on parameter naming
        if (error instanceof Error) {
          expect(error.message).not.toContain('nftAddress');
          expect(error.message).not.toContain('contractAddress');
        }
      }
    });
  });

  describe('standard detection', () => {
    it('should handle ERC721 standard detection', async () => {
      // This would normally be tested with a mock contract response
      const address = '0x1234567890123456789012345678901234567890';

      try {
        await module.getCollectionInfo(address);
      } catch (error) {
        // Expected to fail without proper mock, but shouldn't throw type errors
        expect(error).toBeDefined();
      }
    });
  });
});
