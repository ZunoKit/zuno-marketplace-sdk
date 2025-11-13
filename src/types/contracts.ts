/**
 * Contract types
 * TODO: Implement according to PLAN.md
 */

export interface ContractInfo {
  address: string;
  abi: any[];
  name?: string;
}

export type ContractMethod = (...args: any[]) => Promise<any>;
