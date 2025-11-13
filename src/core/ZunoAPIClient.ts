/**
 * ZunoAPIClient - API client for fetching ABIs
 * TODO: Implement according to PLAN.md Phase 1
 */

export class ZunoAPIClient {
  constructor(_config?: any) {
    // TODO: Implement API client
  }
}

// Query factories for TanStack Query
export const abiQueryKeys = {
  all: ['abis'] as const,
  lists: () => [...abiQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...abiQueryKeys.lists(), { filters }] as const,
  details: () => [...abiQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...abiQueryKeys.details(), id] as const,
};

export const createABIQueryOptions = (_config: any) => {
  // TODO: Implement query options
  return {};
};

export const createABIByIdQueryOptions = (_id: string, _config: any) => {
  // TODO: Implement query options
  return {};
};

export const createContractInfoQueryOptions = (_address: string, _config: any) => {
  // TODO: Implement query options
  return {};
};
