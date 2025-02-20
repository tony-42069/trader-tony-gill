export * from './types';
export { createDefaultSolanaClient } from './client';

// Re-export commonly used types from @solana/web3.js
export {
  PublicKey,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
  Connection
} from '@solana/web3.js';

// Initialize default client
import { createDefaultSolanaClient } from './client';
export const defaultSolanaClient = createDefaultSolanaClient();

// Export utility function to create client with specific commitment
export const createSolanaClientWithCommitment = (commitment: 'processed' | 'confirmed' | 'finalized') => {
  return createDefaultSolanaClient(commitment);
};

// Export health check utility
export const checkSolanaConnection = async () => {
  return defaultSolanaClient.checkHealth();
};
