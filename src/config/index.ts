export * from './types';
export { default as config } from './settings';
export { default as validateConfig } from './validation';

// Validate config on import
import { config } from './settings';
import { validateConfig } from './validation';

// This will throw an error if the config is invalid
validateConfig(config);
