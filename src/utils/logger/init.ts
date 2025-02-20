import fs from 'fs';
import path from 'path';
import { config } from '../../config/settings';
import { logger } from './logger';
import { TraderError, errorCodes } from './errors';
import type { LogContext } from './types';

export const initializeLogger = (): LogContext => {
  try {
    // Ensure log directory exists
    const logDirs = [
      config.logger.logDirectory,
      path.join(config.logger.logDirectory, 'trades'),
      path.join(config.logger.logDirectory, 'errors'),
      path.join(config.logger.logDirectory, 'performance')
    ];

    logDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Create initial log context
    const context = createLogContext();

    // Log initialization
    context.log('info', 'Logger initialized', {
      level: config.logger.logLevel,
      performanceLogging: config.logger.enablePerformanceLogging,
      logDirectory: config.logger.logDirectory,
      subdirectories: logDirs.map(dir => path.basename(dir))
    });

    return context;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new TraderError(
      `Failed to initialize logger: ${errorMessage}`,
      errorCodes.INITIALIZATION_ERROR,
      { error: errorMessage }
    );
  }
};

// Cleanup function for graceful shutdown
export const cleanupLogger = async (): Promise<void> => {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};

// Register cleanup handlers
process.on('SIGTERM', async () => {
  await cleanupLogger();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await cleanupLogger();
  process.exit(0);
});
