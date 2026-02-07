// src/services/errors.ts
// Small typed error model for service-layer errors used across services/hooks.
export class ServiceError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}
