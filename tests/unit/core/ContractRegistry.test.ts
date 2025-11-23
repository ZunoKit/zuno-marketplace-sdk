/**
 * ContractRegistry Unit Tests
 */

import { QueryClient } from '@tanstack/react-query';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';
import { ethers } from 'ethers';

// Mock ZunoAPIClient
jest.mock('../../../src/core/ZunoAPIClient');

describe('ContractRegistry', () => {
  let registry: ContractRegistry;
  let mockAPIClient: jest.Mocked<ZunoAPIClient>;
  let queryClient: QueryClient;
  let mockProvider: ethers.Provider;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockAPIClient = {
      getABI: jest.fn(),
      getContractInfo: jest.fn(),
      createABIQueryOptions: jest.fn(),
    } as unknown as jest.Mocked<ZunoAPIClient>;

    registry = new ContractRegistry(mockAPIClient, queryClient);
    mockProvider = new ethers.JsonRpcProvider('http://localhost:8545');
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('getContract', () => {
    const mockABI = [
      {
        type: 'function',
        name: 'mint',
        inputs: [{ name: 'to', type: 'address' }],
        outputs: [],
      },
    ];

    it('should create and cache contract instance', async () => {
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: mockABI,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      const contract = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider
      );

      expect(contract).toBeDefined();
      expect(contract).toBeInstanceOf(ethers.Contract);
      expect(mockAPIClient.getABI).toHaveBeenCalledWith('ERC721', 'sepolia');
    });

    it('should return cached contract on subsequent calls', async () => {
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: mockABI,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      const contract1 = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider
      );
      const contract2 = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider
      );

      expect(contract1).toBe(contract2);
      expect(mockAPIClient.getABI).toHaveBeenCalledTimes(1);
    });

    it('should use provided address instead of fetching', async () => {
      const customAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);

      const contract = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider,
        customAddress
      );

      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
      expect(mockAPIClient.getContractInfo).not.toHaveBeenCalled();
    });

    it('should throw error for invalid ABI', async () => {
      mockAPIClient.getABI.mockResolvedValueOnce(null as never);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: null as never,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      await expect(
        registry.getContract('ERC721', 'sepolia', mockProvider)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error for invalid address', async () => {
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);

      await expect(
        registry.getContract('ERC721', 'sepolia', mockProvider, 'invalid-address')
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should connect contract to signer when provided', async () => {
      const mockSigner = new ethers.Wallet(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        mockProvider
      );

      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: mockABI,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      const contract = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider,
        undefined,
        mockSigner
      );

      expect(contract).toBeDefined();
      expect(contract.runner).toBe(mockSigner);
    });
  });

  describe('prefetchABIs', () => {
    it('should prefetch multiple ABIs', async () => {
      const mockABI = [{ type: 'function', name: 'test' }];
      mockAPIClient.createABIQueryOptions.mockImplementation(
        (contractType, network) => ({
          queryKey: ['abis', contractType, network],
          queryFn: async () => mockABI,
          staleTime: 300000,
        })
      );

      await registry.prefetchABIs([
        { contractType: 'ERC721', network: 'sepolia' },
        { contractType: 'Exchange', network: 'mainnet' },
      ]);

      expect(mockAPIClient.createABIQueryOptions).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear contract cache', async () => {
      const mockABI = [{ type: 'function', name: 'test' }];
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: mockABI,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      // Create a contract to populate cache
      await registry.getContract('ERC721', 'sepolia', mockProvider);

      // Clear cache
      registry.clearCache();

      // Next call should fetch again
      mockAPIClient.getABI.mockResolvedValueOnce(mockABI);
      mockAPIClient.getContractInfo.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        abi: mockABI,
        network: 'sepolia',
        contractType: 'ERC721',
      });

      await registry.getContract('ERC721', 'sepolia', mockProvider);

      expect(mockAPIClient.getABI).toHaveBeenCalledTimes(2);
    });
  });
});
