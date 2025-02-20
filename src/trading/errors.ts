import { TradeErrorCode } from './types';

export class TradeError extends Error {
  constructor(
    message: string,
    public code: TradeErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TradeError';
  }
}
