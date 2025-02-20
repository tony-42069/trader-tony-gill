import winston from 'winston';
import 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/settings';
import type { LogLevel, LogContext, PerformanceMetric } from './types';

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  trade: 3,
  snipe: 4,
  debug: 5
};

// Custom colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  trade: 'blue',
  snipe: 'magenta',
  debug: 'gray'
};

winston.addColors(colors);

// Create rotating file transport
const createFileRotateTransport = (filename: string, level: LogLevel) => 
  new winston.transports.DailyRotateFile({
    filename: `${config.logger.logDirectory}/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logger.maxFileSize,
    maxFiles: config.logger.retentionDays,
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  });

// Create logger instance
export const logger = winston.createLogger({
  levels,
  level: config.logger.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    createFileRotateTransport('combined', 'debug'),
    createFileRotateTransport('error', 'error'),
    createFileRotateTransport('trades', 'trade')
  ]
});

// Add console transport if enabled
if (config.logger.enableConsole) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Create logging context for request tracking
export const createLogContext = (): LogContext => {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  return {
    requestId,
    timestamp,
    log: (level: LogLevel, message: string, meta = {}) => {
      logger.log(level, message, {
        requestId,
        timestamp,
        ...meta
      });
    }
  };
};

// Performance logging utility
export const logPerformance = (
  operation: string, 
  startTime: number,
  metadata?: Record<string, any>
) => {
  if (config.logger.enablePerformanceLogging) {
    const metric: PerformanceMetric = {
      operation,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    logger.debug('Performance metric', metric);
  }
};

// Utility to measure and log function execution time
export const withPerformanceLogging = async <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await fn();
    logPerformance(operation, startTime, metadata);
    return result;
  } catch (error) {
    logPerformance(operation, startTime, {
      ...metadata,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};
