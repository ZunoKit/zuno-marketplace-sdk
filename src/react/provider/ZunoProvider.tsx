/**
 * ZunoProvider - React Provider component
 * TODO: Implement according to PLAN.md Phase 3
 */

import React from 'react';

export interface ZunoProviderProps {
  config?: any;
  children: React.ReactNode;
}

const ZunoContext = React.createContext<any>(null);

export function ZunoProvider({ config: _config, children }: ZunoProviderProps) {
  // TODO: Implement provider with Wagmi and React Query setup
  return <ZunoContext.Provider value={{}}>{children}</ZunoContext.Provider>;
}

export function useZuno() {
  const context = React.useContext(ZunoContext);
  if (!context) {
    throw new Error('useZuno must be used within ZunoProvider');
  }
  return context;
}
