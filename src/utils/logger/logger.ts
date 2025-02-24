import winston from 'winston';
import 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import { LogLevel } from './types';

// Create the logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'trader-tony',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Add request ID to all logs
logger.defaultMeta = {
  ...logger.defaultMeta,
  requestId: uuidv4()
};

// Export the logger instance
export { logger };
