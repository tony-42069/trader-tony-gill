import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { createRaydiumClient, RAYDIUM_PROGRAM_ID } from './index';

async function swapExample() {
  try {
    // Initialize connection
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // Create Raydium client
    const client = createRaydiumClient(connection, RAYDIUM_PROGRAM_ID);

    // Example pool configuration (SOL/USDC pool)
    const poolConfig = {
      id: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',  // SOL/USDC pool
      baseMint: 'So11111111111111111111111111111111111111112',  // SOL
      quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
      lpMint: '8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu',  // LP token
      baseDecimals: 9,  // SOL has 9 decimals
      quoteDecimals: 6   // USDC has 6 decimals
    };

    // Create and initialize pool
    const pool = await client.createPool(poolConfig);

    // Example wallet public key (replace with actual wallet)
    const walletPublicKey = new PublicKey('YourWalletPublicKeyHere');

    if (!pool) {
      throw new Error('Failed to create pool');
    }

    // Prepare swap parameters (example: swap 0.1 SOL for USDC)
    const swapParams = {
      tokenIn: new PublicKey(poolConfig.baseMint),
      tokenOut: new PublicKey(poolConfig.quoteMint),
      amountIn: BigInt('100000000'),  // 0.1 SOL (9 decimals)
      amountOutMin: BigInt('900000'),  // Minimum 0.9 USDC (6 decimals)
      pool
    };

    // Execute swap
    console.log('Executing swap...');
    const result = await client.swap(swapParams);

    console.log('Swap successful!');
    console.log('Success:', result.success);
    console.log('Amount out:', result.amountOut.toString());
    console.log('Price impact:', result.priceImpact.toFixed(2) + '%');
    console.log('Fee:', result.fee.toString());

  } catch (error) {
    if (error instanceof Error) {
      console.error('Swap failed:', error.message);
    } else {
      console.error('Swap failed with unknown error');
    }
  }
}

// Example usage:
// swapExample().catch(console.error);
