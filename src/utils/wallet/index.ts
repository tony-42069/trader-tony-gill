export * from './types';
export { createWallet } from './wallet';
export { createBalanceMonitor } from './monitor';

// Re-export commonly used types from @solana/web3.js
export { Keypair, PublicKey } from '@solana/web3.js';

// Initialize default wallet from config
import { config } from '../../config/settings';
import { createWallet } from './wallet';
import { createBalanceMonitor } from './monitor';
import { WalletConfig } from './types';

const defaultWalletConfig: WalletConfig = {
  seedPhrase: config.solana.seedPhrase,
  network: 'mainnet-beta',
  balanceThresholds: {
    minimum: 0.1,    // 0.1 SOL minimum balance
    warning: 0.5,    // Alert at 0.5 SOL
    maximum: 10.0    // Maximum 10 SOL (to limit risk)
  },
  monitoringInterval: 60000 // Check every minute
};

// Create default instances
export const defaultWallet = createWallet(defaultWalletConfig);
export const defaultMonitor = createBalanceMonitor(defaultWallet);

// Start monitoring by default
defaultMonitor.startMonitoring();

// Cleanup on process exit
process.on('SIGTERM', () => {
  defaultMonitor.destroy();
});

process.on('SIGINT', () => {
  defaultMonitor.destroy();
});

// Export utility functions
export const getWalletBalance = async () => defaultWallet.getBalance();
export const isWalletActive = () => defaultWallet.isActive();
export const getWalletState = () => defaultWallet.getState();
export const getTransactionHistory = () => defaultWallet.getTransactionHistory();
