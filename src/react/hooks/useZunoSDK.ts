/**
 * Hook to access SDK instance directly from React components
 */

'use client';

import { useContext } from 'react';
import { ZunoSDK } from '../../core/ZunoSDK';

// Import context from ZunoContextProvider (we need to export it)
import { ZunoContext } from '../provider/ZunoContextProvider';
import { ZunoSDKError, ErrorCodes } from '../../utils/errors';

/**
 * Access the SDK instance from React context
 *
 * Use this hook when you need direct access to the SDK instance
 * instead of using individual feature hooks (useExchange, useAuction, etc.)
 *
 * @returns ZunoSDK instance
 * @throws {ZunoSDKError} If used outside ZunoProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const sdk = useZunoSDK();
 *
 *   // Access logger
 *   sdk.logger.info('Component mounted');
 *
 *   // Access config
 *   const config = sdk.getConfig();
 *
 *   // Access any module directly
 *   const listing = await sdk.exchange.listNFT(params);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useZunoSDK(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    throw new ZunoSDKError(
      ErrorCodes.MISSING_PROVIDER,
      'useZunoSDK must be used within ZunoProvider or ZunoContextProvider'
    );
  }

  return context.sdk;
}
