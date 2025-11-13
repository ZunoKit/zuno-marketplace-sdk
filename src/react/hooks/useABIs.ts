/**
 * ABI management hooks
 * TODO: Implement according to PLAN.md Phase 3
 */

export function useABI(_contractId: string) {
  // TODO: Implement ABI query hook
  return { data: null, isLoading: false, error: null };
}

export function useContractInfo(_address: string) {
  // TODO: Implement contract info query hook
  return { data: null, isLoading: false, error: null };
}

export function usePrefetchABIs(_contractIds: string[]) {
  // TODO: Implement prefetch hook
  return { prefetch: () => {} };
}

export function useABIsCached(_contractIds: string[]) {
  // TODO: Implement cache check hook
  return { allCached: false };
}

export function useInitializeABIs(_contractIds: string[]) {
  // TODO: Implement initialization hook
  return { isInitialized: false };
}
