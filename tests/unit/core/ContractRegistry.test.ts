/**
 * ContractRegistry Unit Tests
 */

import { QueryClient } from '@tanstack/react-query';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';
import { ethers } from 'ethers';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContractRegistry', () => {
  let registry: ContractRegistry;
  let apiClient: ZunoAPIClient;
  let queryClient: QueryClient;
  let mockProvider: ethers.Provider;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup axios mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    apiClient = new ZunoAPIClient('test-api-key');
    registry = new ContractRegistry(apiClient, queryClient);
    mockProvider = new ethers.JsonRpcProvider('http://localhost:8545');
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
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

    const mockAbiEntity = {
      id: 'abi-123',
      contractName: 'ERC721',
      abi: mockABI,
      version: '1.0.0',
      networkId: 'sepolia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should create and cache contract instance', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              address: '0x1234567890123456789012345678901234567890',
              abi: mockABI,
              networkId: 'sepolia',
              contractType: 'ERC721',
              deploymentBlock: 123456,
              deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          },
        });

      const contract = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider
      );

      expect(contract).toBeDefined();
      expect(contract).toBeInstanceOf(ethers.Contract);
    });

    it('should return cached contract on subsequent calls', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              address: '0x1234567890123456789012345678901234567890',
              abi: mockABI,
              networkId: 'sepolia',
              contractType: 'ERC721',
              deploymentBlock: 123456,
              deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          },
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
      // Should only call API once due to caching (once for ABI via query cache, once for contract info)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should use provided address instead of fetching', async () => {
      const customAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      const contract = await registry.getContract(
        'ERC721',
        'sepolia',
        mockProvider,
        customAddress
      );

      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
      // Should only call for ABI, not contract info
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid ABI', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockAbiEntity,
            abi: null,
          },
          timestamp: Date.now(),
        },
      });

      await expect(
        registry.getContract('ERC721', 'sepolia', mockProvider)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error for invalid address', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      await expect(
        registry.getContract('ERC721', 'sepolia', mockProvider, 'invalid-address')
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should connect contract to signer when provided', async () => {
      const mockSigner = new ethers.Wallet(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        mockProvider
      );

      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              address: '0x1234567890123456789012345678901234567890',
              abi: mockABI,
              networkId: 'sepolia',
              contractType: 'ERC721',
              deploymentBlock: 123456,
              deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          },
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
      const mockAbiEntity = {
        id: 'abi-123',
        contractName: 'ERC721',
        abi: mockABI,
        version: '1.0.0',
        networkId: 'sepolia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { ...mockAbiEntity, contractName: 'Exchange' },
            timestamp: Date.now(),
          },
        });

      await registry.prefetchABIs([
        { contractType: 'ERC721', network: 'sepolia' },
        { contractType: 'Exchange', network: 'mainnet' },
      ]);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear contract cache', async () => {
      const mockABI = [{ type: 'function', name: 'test' }];
      const mockAbiEntity = {
        id: 'abi-123',
        contractName: 'ERC721',
        abi: mockABI,
        version: '1.0.0',
        networkId: 'sepolia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              address: '0x1234567890123456789012345678901234567890',
              abi: mockABI,
              networkId: 'sepolia',
              contractType: 'ERC721',
              deploymentBlock: 123456,
              deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          },
        });

      // Create a contract to populate cache
      await registry.getContract('ERC721', 'sepolia', mockProvider);

      // Clear cache
      registry.clearCache();

      // Next call should fetch again
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockAbiEntity,
            timestamp: Date.now(),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              address: '0x1234567890123456789012345678901234567890',
              abi: mockABI,
              networkId: 'sepolia',
              contractType: 'ERC721',
              deploymentBlock: 123456,
              deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          },
        });

      await registry.getContract('ERC721', 'sepolia', mockProvider);

      // Should be called 4 times total (2 for first call, 2 for second call after clear)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    });
  });
});
