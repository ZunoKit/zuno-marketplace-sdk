/**
 * Configuration types
 * TODO: Implement according to PLAN.md
 */

export type NetworkType = 'sepolia' | 'mainnet' | 'polygon' | 'bsc';

export interface SDKConfig {
  apiKey?: string;
  network?: NetworkType;
  apiBaseUrl?: string;
}
