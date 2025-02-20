import { MonitorErrorCode } from './types';

export class MonitorError extends Error {
  constructor(
    message: string,
    public code: MonitorErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MonitorError';
  }
}
