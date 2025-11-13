/**
 * Error handling utilities
 * TODO: Implement according to PLAN.md
 */

export enum ErrorCodes {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class ZunoSDKError extends Error {
  constructor(
    message: string,
    public code: ErrorCodes = ErrorCodes.UNKNOWN_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'ZunoSDKError';
  }
}
