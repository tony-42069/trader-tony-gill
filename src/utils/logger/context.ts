import { LogContext } from './types';

export function createLogContext(): LogContext {
  return {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    hostname: require('os').hostname(),
    environment: process.env.NODE_ENV || 'development'
  };
} 