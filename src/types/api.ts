/**
 * API types
 * TODO: Implement according to PLAN.md
 */

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ABIResponse {
  abi: any[];
  address?: string;
  name?: string;
}
