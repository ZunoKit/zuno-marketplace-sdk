/**
 * Hook to access SDK logger in React components
 */

'use client';

import { useZunoSDK } from './useZunoSDK';
import type { Logger } from '../../utils/logger';

/**
 * Access SDK logger in React components
 *
 * This hook provides direct access to the SDK's logger instance,
 * allowing consistent logging across React and non-React code.
 *
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const logger = useZunoLogger();
 *
 *   useEffect(() => {
 *     logger.info('Component mounted');
 *     return () => logger.info('Component unmounted');
 *   }, [logger]);
 *
 *   const handleClick = () => {
 *     logger.debug('Button clicked', { timestamp: Date.now() });
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useZunoLogger(): Logger {
  const sdk = useZunoSDK();
  return sdk.logger;
}
