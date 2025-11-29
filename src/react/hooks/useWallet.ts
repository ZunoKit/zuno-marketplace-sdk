/**
 * Wallet hooks using Wagmi
 */

'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import type { Connector } from 'wagmi';
import { useEffect, useCallback, useMemo } from 'react';
import type { Eip1193Provider } from 'ethers';
import { useZuno } from '../provider/ZunoContextProvider';

export interface UseWalletReturn {
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  connector: Connector | undefined;
  isPending: boolean;
  connectors: readonly Connector[];
  connect: (connectorId?: string) => void;
  disconnect: () => void;
  switchChain: ReturnType<typeof useSwitchChain>['switchChain'];
  error: Error | null;
  isError: boolean;
}

/**
 * Hook for wallet operations
 *
 * @returns Wallet state and functions for connection management
 *
 * @example
 * ```tsx
 * function WalletButton() {
 *   const { isConnected, connect, disconnect, error } = useWallet();
 *
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *
 *   return isConnected
 *     ? <button onClick={disconnect}>Disconnect</button>
 *     : <button onClick={() => connect()}>Connect</button>;
 * }
 * ```
 */
export function useWallet(): UseWalletReturn {
  const sdk = useZuno();
  const { address, isConnected, chainId, connector } = useAccount();
  const {
    connect,
    connectors,
    isPending,
    error: connectError,
  } = useConnect();
  const { disconnect, error: disconnectError } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Combine errors from connect and disconnect
  const error = useMemo(
    () => connectError || disconnectError || null,
    [connectError, disconnectError]
  );
  const isError = !!error;

  // Update SDK provider when wallet changes
  useEffect(() => {
    if (connector && isConnected) {
      (async () => {
        try {
          const provider = (await connector.getProvider()) as Eip1193Provider;
          const { BrowserProvider } = await import('ethers');
          const ethersProvider = new BrowserProvider(provider);
          const signer = await ethersProvider.getSigner();
          sdk.updateProvider(ethersProvider, signer);
        } catch (err) {
          sdk.logger.error('[useWallet] Failed to update provider', { error: err });
        }
      })();
    }
  }, [connector, isConnected, sdk]);

  // Memoize connect function
  const handleConnect = useCallback(
    (connectorId?: string) => {
      const targetConnector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors[0];

      if (targetConnector) {
        connect({ connector: targetConnector });
      }
    },
    [connectors, connect]
  );

  // Wrap disconnect for onClick compatibility
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    address,
    chainId,
    isConnected,
    connector,
    isPending,
    connectors,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain,
    error,
    isError,
  };
}
