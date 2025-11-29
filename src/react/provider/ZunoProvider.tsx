/**
 * All-in-One Zuno Provider with Wagmi & React Query built-in
 * Use this for simple apps without existing Wagmi setup
 */

'use client';

import React, { useState, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, type Chain } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ZunoContextProvider } from './ZunoContextProvider';
import type { ZunoSDKConfig } from '../../types/config';

export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;
}

/**
 * Get chain config from network
 */
function getChainFromNetwork(network: ZunoSDKConfig['network']): Chain {
  switch (network) {
    case 'mainnet':
      return mainnet;
    case 'sepolia':
      return sepolia;
    case 'polygon':
      return polygon;
    case 'arbitrum':
      return arbitrum;
    default:
      // For local development or custom networks - use sepolia as default
      if (typeof network === 'number') {
        return {
          id: network,
          name: 'Anvil',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['http://127.0.0.1:8545'] },
          },
          testnet: true,
        } as const satisfies Chain;
      }
      return sepolia;
  }
}

/**
 * All-in-One Zuno Provider
 * Includes Wagmi + React Query + Zuno SDK
 *
 * Use this when you DON'T have Wagmi setup yet.
 * For apps with existing Wagmi, use ZunoContextProvider instead.
 */
export function ZunoProvider({
  config,
  children,
}: ZunoProviderProps) {
  // Create QueryClient with caching config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: config.cache?.ttl || 5 * 60 * 1000,
            gcTime: config.cache?.gcTime || 10 * 60 * 1000,
            retry: config.retryPolicy?.maxRetries || 3,
            retryDelay: (attemptIndex) => {
              const delay = config.retryPolicy?.initialDelay || 1000;
              return config.retryPolicy?.backoff === 'exponential'
                ? Math.min(delay * 2 ** attemptIndex, 30000)
                : delay * (attemptIndex + 1);
            },
          },
        },
      })
  );

  // Create Wagmi config
  const [wagmiConfig] = useState(() => {
    const chain = getChainFromNetwork(config.network);

    const baseConnectors = [
      injected(),
      coinbaseWallet({ appName: 'Zuno Marketplace' }),
    ];

    const connectors = config.walletConnectProjectId
      ? [
          ...baseConnectors,
          walletConnect({
            projectId: config.walletConnectProjectId,
            showQrModal: true,
          }),
        ]
      : baseConnectors;

    return createConfig({
      chains: [chain],
      connectors,
      transports: {
        [chain.id]: http(config.rpcUrl),
      },
    });
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContextProvider config={config} queryClient={queryClient}>
          {children}
        </ZunoContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Re-export useZuno for convenience
export { useZuno } from './ZunoContextProvider';
