/**
 * ZunoAPIClient Unit Tests
 */

import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError, ErrorCodes } from '../../../src/utils/errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('ZunoAPIClient', () => {
  let client: ZunoAPIClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new ZunoAPIClient({
      apiKey: 'test-api-key',
      network: 'sepolia',
      apiBaseUrl: 'https://api.test.com',
    });
    mockFetch.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(client).toBeDefined();
    });

    it('should throw error without API key', () => {
      expect(() => {
        new ZunoAPIClient({
          apiKey: '',
          network: 'sepolia',
        });
      }).toThrow(ZunoSDKError);
    });

    it('should use default base URL when not provided', () => {
      const defaultClient = new ZunoAPIClient({
        apiKey: 'test-key',
        network: 'mainnet',
      });
      expect(defaultClient).toBeDefined();
    });
  });

  describe('getABI', () => {
    it('should fetch ABI successfully', async () => {
      const mockABI = [{ type: 'function', name: 'mint' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ abi: mockABI }),
      } as Response);

      const abi = await client.getABI('ERC721', 'sepolia');

      expect(abi).toEqual(mockABI);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/abi/ERC721'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.getABI('InvalidContract', 'sepolia')).rejects.toThrow(
        ZunoSDKError
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getABI('ERC721', 'sepolia')).rejects.toThrow();
    });
  });

  describe('getContractInfo', () => {
    it('should fetch contract info successfully', async () => {
      const mockInfo = {
        address: '0x123456789abcdef',
        abi: [],
        network: 'sepolia',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfo,
      } as Response);

      const info = await client.getContractInfo('Exchange', 'sepolia');

      expect(info).toEqual(mockInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/contracts/Exchange'),
        expect.any(Object)
      );
    });

    it('should throw error on invalid contract type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(
        client.getContractInfo('InvalidType' as never, 'sepolia')
      ).rejects.toThrow();
    });
  });

  describe('query factory methods', () => {
    it('should create ABI query options', () => {
      const options = client.createABIQueryOptions('ERC721', 'mainnet');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('abis');
      expect(options.queryKey).toContain('ERC721');
      expect(options.queryKey).toContain('mainnet');
    });

    it('should create contract info query options', () => {
      const options = client.createContractInfoQueryOptions('Auction', 'polygon');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('contracts');
      expect(options.queryKey).toContain('Auction');
    });
  });

  describe('error handling', () => {
    it('should include error context in exceptions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' }),
      } as Response);

      try {
        await client.getABI('ERC721', 'sepolia');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        if (error instanceof ZunoSDKError) {
          expect(error.code).toBeDefined();
        }
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      } as Response);

      await expect(client.getABI('ERC721', 'sepolia')).rejects.toThrow();
    });
  });
});
