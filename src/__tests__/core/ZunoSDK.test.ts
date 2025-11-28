/**
 * ZunoSDK Core Tests
 */

import { ZunoSDK, getSdk, getLogger } from '../../core/ZunoSDK';
import { ZunoSDKError } from '../../utils/errors';
import { ZunoLogger } from '../../utils/logger';

describe('ZunoSDK', () => {
  describe('initialization', () => {
    it('should initialize with valid config', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-api-key',
        network: 'sepolia',
      });

      expect(sdk).toBeDefined();
      expect(sdk.getConfig()).toMatchObject({
        apiKey: 'test-api-key',
        network: 'sepolia',
      });
    });

    it('should throw error without API key', () => {
      expect(() => {
        new ZunoSDK({
          apiKey: '',
          network: 'sepolia',
        });
      }).toThrow(ZunoSDKError);

      expect(() => {
        new ZunoSDK({
          apiKey: '',
          network: 'sepolia',
        });
      }).toThrow('API key is required');
    });

    it('should throw error without network', () => {
      expect(() => {
        new ZunoSDK({
          apiKey: 'test-key',
          network: '' as never,
        });
      }).toThrow(ZunoSDKError);
    });
  });

  describe('modules', () => {
    let sdk: ZunoSDK;

    beforeEach(() => {
      sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });
    });

    it('should lazy load exchange module', () => {
      const exchange = sdk.exchange;
      expect(exchange).toBeDefined();
      expect(exchange).toBe(sdk.exchange); // Same instance
    });

    it('should lazy load collection module', () => {
      const collection = sdk.collection;
      expect(collection).toBeDefined();
      expect(collection).toBe(sdk.collection);
    });

    it('should lazy load auction module', () => {
      const auction = sdk.auction;
      expect(auction).toBeDefined();
      expect(auction).toBe(sdk.auction);
    });

    it('should lazy load offers module', () => {
      const offers = sdk.offers;
      expect(offers).toBeDefined();
      expect(offers).toBe(sdk.offers);
    });

    it('should lazy load bundles module', () => {
      const bundles = sdk.bundles;
      expect(bundles).toBeDefined();
      expect(bundles).toBe(sdk.bundles);
    });
  });

  describe('provider management', () => {
    let sdk: ZunoSDK;

    beforeEach(() => {
      sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });
    });

    it('should return undefined provider initially', () => {
      expect(sdk.getProvider()).toBeUndefined();
      expect(sdk.getSigner()).toBeUndefined();
    });

    it('should update provider', () => {
      const mockProvider = {} as any;
      const mockSigner = {} as any;

      sdk.updateProvider(mockProvider, mockSigner);

      expect(sdk.getProvider()).toBe(mockProvider);
      expect(sdk.getSigner()).toBe(mockSigner);
    });
  });

  describe('API client', () => {
    it('should expose API client', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });

      const apiClient = sdk.getAPIClient();
      expect(apiClient).toBeDefined();
    });
  });

  describe('QueryClient', () => {
    it('should expose QueryClient', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });

      const queryClient = sdk.getQueryClient();
      expect(queryClient).toBeDefined();
    });

    it('should use custom QueryClient if provided', () => {
      const mockQueryClient = { clear: jest.fn() } as any;

      const sdk = new ZunoSDK(
        {
          apiKey: 'test-key',
          network: 'sepolia',
        },
        { queryClient: mockQueryClient }
      );

      expect(sdk.getQueryClient()).toBe(mockQueryClient);
    });
  });

  describe('logger', () => {
    it('should expose logger via getter', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
        logger: { level: 'debug' },
      });

      expect(sdk.logger).toBeDefined();
      expect(sdk.logger).toBeInstanceOf(ZunoLogger);
    });

    it('should return same logger instance on multiple accesses', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
        logger: { level: 'info' },
      });

      const logger1 = sdk.logger;
      const logger2 = sdk.logger;

      expect(logger1).toBe(logger2);
    });

    it('should have info and error methods', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
        logger: { level: 'debug' },
      });

      expect(typeof sdk.logger.info).toBe('function');
      expect(typeof sdk.logger.error).toBe('function');
      expect(typeof sdk.logger.warn).toBe('function');
      expect(typeof sdk.logger.debug).toBe('function');
    });
  });

  describe('singleton pattern', () => {
    afterEach(() => {
      ZunoSDK.resetInstance();
    });

    it('should return same instance on multiple getInstance calls', () => {
      const config = { apiKey: 'test-key', network: 'sepolia' as const };
      const sdk1 = ZunoSDK.getInstance(config);
      const sdk2 = ZunoSDK.getInstance();

      expect(sdk1).toBe(sdk2);
    });

    it('should throw if getInstance called without config first', () => {
      expect(() => {
        ZunoSDK.getInstance();
      }).toThrow(ZunoSDKError);

      expect(() => {
        ZunoSDK.getInstance();
      }).toThrow('Config required for first getInstance call');
    });

    it('should reset instance correctly', () => {
      const config = { apiKey: 'test-key', network: 'sepolia' as const };
      ZunoSDK.getInstance(config);
      ZunoSDK.resetInstance();

      expect(() => {
        ZunoSDK.getInstance();
      }).toThrow();
    });

    it('should report hasInstance correctly', () => {
      expect(ZunoSDK.hasInstance()).toBe(false);

      ZunoSDK.getInstance({ apiKey: 'test-key', network: 'sepolia' });
      expect(ZunoSDK.hasInstance()).toBe(true);

      ZunoSDK.resetInstance();
      expect(ZunoSDK.hasInstance()).toBe(false);
    });

    it('should allow re-initialization after reset', () => {
      const config1 = { apiKey: 'key1', network: 'sepolia' as const };
      ZunoSDK.getInstance(config1);

      ZunoSDK.resetInstance();

      const config2 = { apiKey: 'key2', network: 'mainnet' as const };
      const sdk2 = ZunoSDK.getInstance(config2);

      expect(sdk2.getConfig().apiKey).toBe('key2');
      expect(sdk2.getConfig().network).toBe('mainnet');
    });

    it('should provide static getLogger method', () => {
      ZunoSDK.getInstance({
        apiKey: 'test-key',
        network: 'sepolia',
        logger: { level: 'debug' },
      });

      const logger = ZunoSDK.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('convenience functions', () => {
    afterEach(() => {
      ZunoSDK.resetInstance();
    });

    it('getSdk should return singleton instance', () => {
      const config = { apiKey: 'test-key', network: 'sepolia' as const };
      const initialized = ZunoSDK.getInstance(config);
      const fromGetSdk = getSdk();

      expect(fromGetSdk).toBe(initialized);
    });

    it('getLogger should return logger from singleton', () => {
      ZunoSDK.getInstance({
        apiKey: 'test-key',
        network: 'sepolia',
        logger: { level: 'debug' },
      });

      const logger = getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('getSdk should throw if not initialized', () => {
      expect(() => getSdk()).toThrow(ZunoSDKError);
    });

    it('getLogger should throw if not initialized', () => {
      expect(() => getLogger()).toThrow(ZunoSDKError);
    });
  });
});
