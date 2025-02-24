import { LogContext } from './types';
import { v4 as uuidv4 } from 'uuid';

export function createLogContext(): LogContext {
  return {
    service: 'trader-tony',
    environment: process.env.NODE_ENV || 'development',
    requestId: uuidv4(),
    timestamp: new Date().toISOString()
  };
} 