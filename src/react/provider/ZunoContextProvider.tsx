/**
 * Core Zuno Context Provider
 * Provides SDK instance without Wagmi/React Query wrappers
 */

'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ZunoSDK } from '../../core/ZunoSDK';
import type { ZunoSDKConfig } from '../../types/config';
import { QueryClient } from '@tanstack/react-query';

export interface ZunoContextValue {
  sdk: ZunoSDK;
}

const ZunoContext = createContext<ZunoContextValue | null>(null);

export interface ZunoContextProviderProps {
  config: ZunoSDKConfig;
  queryClient?: QueryClient; // Optional external QueryClient
  children: ReactNode;
}

/**
 * Core Context Provider - No Wagmi/React Query wrappers
 * Use this when you already have Wagmi + React Query setup
 */
export function ZunoContextProvider({
  config,
  queryClient,
  children
}: ZunoContextProviderProps) {
  // Create SDK instance
  const sdk = useMemo(
    () => new ZunoSDK(config, queryClient ? { queryClient } : undefined),
    [config, queryClient]
  );

  const contextValue = useMemo<ZunoContextValue>(
    () => ({ sdk }),
    [sdk]
  );

  return (
    <ZunoContext.Provider value={contextValue}>
      {children}
    </ZunoContext.Provider>
  );
}

/**
 * Hook to access Zuno SDK
 */
export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    throw new Error('useZuno must be used within ZunoContextProvider or ZunoProvider');
  }

  return context.sdk;
}
