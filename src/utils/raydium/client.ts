import { 
  Connection, 
  PublicKey, 
  VersionedTransaction, 
  TransactionMessage,
  MessageV0
} from '@solana/web3.js';
import BN from 'bn.js';
import { RaydiumPool } from './pool';
import { 
  SwapParams, 
  SwapResult, 
  RaydiumPoolState
} from './types';
import { 
  createSwapInstruction, 
  findPoolAuthorityPDA,
  findAssociatedTokenAddress,
  SwapInstructionAccounts 
} from './instructions';
import { logger } from '../logger';

export class RaydiumClient {
  protected pools: Map<string, RaydiumPool> = new Map();

  constructor(
    readonly connection: Connection,
    readonly programId: PublicKey
  ) {}

  async createPool(config: {
    id: string;
    baseMint: string;
    quoteMint: string;
    lpMint: string;
    baseDecimals: number;
    quoteDecimals: number;
  }): Promise<RaydiumPool | null> {
    try {
      const poolId = new PublicKey(config.id);
      const pool = new RaydiumPool(
        this.connection,
        poolId,
        (change: any) => console.log('Pool state change:', change)
      );
      
      // Verify pool exists and is accessible
      await pool.fetchPoolState();
      
      this.pools.set(config.id, pool);
      return pool;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to create pool: ${message}`);
      return null;
    }
  }

  async getPool(tokenAddress: string): Promise<RaydiumPool | null> {
    try {
      // Check if we already have a pool for this token
      for (const pool of this.pools.values()) {
        const baseMint = pool.baseMint.toString();
        const quoteMint = pool.quoteMint.toString();
        
        if (baseMint === tokenAddress || quoteMint === tokenAddress) {
          return pool;
        }
      }
      
      // If not found, try to find it from Raydium API
      const pools = await this.getPools();
      for (const pool of pools) {
        const baseMint = pool.baseMint.toString();
        const quoteMint = pool.quoteMint.toString();
        
        if (baseMint === tokenAddress || quoteMint === tokenAddress) {
          return pool;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get pool:', error);
      return null;
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<number | null> {
    try {
      const pool = await this.getPool(tokenAddress);
      if (!pool) {
        return null;
      }
      
      const poolState = await pool.getState();
      const baseReserve = BigInt(poolState.baseReserve.toString());
      const quoteReserve = BigInt(poolState.quoteReserve.toString());
      
      // Check if token is base or quote
      const isBase = pool.baseMint.toString() === tokenAddress;
      
      // Calculate price
      if (isBase) {
        return Number(quoteReserve) / Number(baseReserve);
      } else {
        return Number(baseReserve) / Number(quoteReserve);
      }
    } catch (error) {
      logger.error('Failed to get token price:', error);
      return null;
    }
  }

  async getPools(): Promise<RaydiumPool[]> {
    // Return cached pools
    return Array.from(this.pools.values());
  }

  async findBestPool(tokenAddress: string): Promise<RaydiumPool | null> {
    try {
      // Find all pools that contain this token
      const matchingPools: RaydiumPool[] = [];
      
      for (const pool of this.pools.values()) {
        const baseMint = pool.baseMint.toString();
        const quoteMint = pool.quoteMint.toString();
        
        if (baseMint === tokenAddress || quoteMint === tokenAddress) {
          matchingPools.push(pool);
        }
      }
      
      if (matchingPools.length === 0) {
        return null;
      }
      
      // Find the pool with the highest liquidity
      let bestPool = matchingPools[0];
      let highestLiquidity = 0;
      
      for (const pool of matchingPools) {
        const poolState = await pool.getState();
        const quoteReserve = Number(poolState.quoteReserve.toString());
        
        if (quoteReserve > highestLiquidity) {
          highestLiquidity = quoteReserve;
          bestPool = pool;
        }
      }
      
      return bestPool;
    } catch (error) {
      logger.error('Failed to find best pool:', error);
      return null;
    }
  }

  async getPoolByAddress(poolAddress: string): Promise<RaydiumPool | null> {
    try {
      // Check if we already have this pool
      const pool = this.pools.get(poolAddress);
      if (pool) {
        return pool;
      }
      
      // If not, create a new pool instance
      const poolId = new PublicKey(poolAddress);
      const newPool = new RaydiumPool(
        this.connection,
        poolId,
        (change: any) => console.log('Pool state change:', change)
      );
      
      // Verify pool exists and is accessible
      await newPool.fetchPoolState();
      
      // Add to cache
      this.pools.set(poolAddress, newPool);
      
      return newPool;
    } catch (error) {
      logger.error('Failed to get pool by address:', error);
      return null;
    }
  }

  async swap(params: SwapParams): Promise<SwapResult> {
    try {
      // Convert parameters to match our internal implementation
      const pool = params.pool;
      const poolState = await pool.getState();
      
      // Determine if this is a base to quote or quote to base swap
      const isBaseInput = params.tokenIn.toString() === pool.baseMint.toString();
      
      // Calculate amounts and price impact
      const amountIn = new BN(params.amountIn.toString());
      const minAmountOut = new BN(params.amountOutMin.toString());
      
      // Calculate swap result
      const { amountOut, priceImpact, fee } = this.calculateSwap(
        poolState,
        amountIn,
        isBaseInput
      );
      
      // Return result
      return {
        success: true,
        amountOut: BigInt(amountOut.toString()),
        fee: BigInt(fee.toString()),
        priceImpact
      };
    } catch (error) {
      logger.error('Swap failed:', error);
      return {
        success: false,
        amountOut: BigInt(0),
        fee: BigInt(0),
        priceImpact: 0
      };
    }
  }

  calculateSwap(
    poolState: RaydiumPoolState,
    amountIn: BN,
    isBaseInput: boolean
  ): {
    amountOut: BN;
    priceImpact: number;
    fee: BN;
  } {
    const { baseReserve, quoteReserve } = poolState;
    const FEE_NUMERATOR = new BN(25);
    const FEE_DENOMINATOR = new BN(10000);

    // Calculate fee
    const fee = amountIn.mul(FEE_NUMERATOR).div(FEE_DENOMINATOR);
    const amountInAfterFee = amountIn.sub(fee);

    // Calculate amount out using constant product formula
    const inputReserve = isBaseInput ? baseReserve : quoteReserve;
    const outputReserve = isBaseInput ? quoteReserve : baseReserve;

    const numerator = amountInAfterFee.mul(outputReserve);
    const denominator = inputReserve.add(amountInAfterFee);
    const amountOut = numerator.div(denominator);

    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(
      amountIn,
      amountOut,
      inputReserve,
      outputReserve
    );

    return { amountOut, priceImpact, fee };
  }

  calculatePriceImpact(
    amountIn: BN,
    amountOut: BN,
    inputReserve: BN,
    outputReserve: BN
  ): number {
    // Calculate spot price before swap
    const spotPrice = outputReserve.mul(new BN(1000000)).div(inputReserve);

    // Calculate effective price
    const effectivePrice = amountOut
      .mul(new BN(1000000))
      .div(amountIn);

    // Calculate price impact as percentage
    const priceImpact = spotPrice
      .sub(effectivePrice)
      .mul(new BN(100))
      .div(spotPrice)
      .toNumber() / 1000000;

    return priceImpact;
  }

  async buildSwapTransaction(
    params: {
      poolId: PublicKey;
      amountIn: BN;
      minAmountOut: BN;
      isBaseInput: boolean;
      walletPublicKey: PublicKey;
    },
    poolState: any
  ): Promise<VersionedTransaction> {
    try {
      // Get pool authority PDA
      const [authority] = await findPoolAuthorityPDA(params.poolId, this.programId);

      // Get token accounts
      const userSourceToken = await findAssociatedTokenAddress(
        params.walletPublicKey,
        params.isBaseInput ? poolState.baseMint : poolState.quoteMint
      );
      const userDestinationToken = await findAssociatedTokenAddress(
        params.walletPublicKey,
        params.isBaseInput ? poolState.quoteMint : poolState.baseMint
      );

      // Build instruction accounts
      const accounts: SwapInstructionAccounts = {
        poolId: params.poolId,
        tokenAccountA: userSourceToken,
        tokenAccountB: userDestinationToken,
        tokenPool: poolState.lpMint,
        authority,
        userSourceToken,
        userDestinationToken,
        userOwner: params.walletPublicKey
      };

      // Create swap instruction
      const swapIx = createSwapInstruction(
        this.programId,
        accounts,
        params.amountIn,
        params.minAmountOut
      );

      // Build transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: accounts.userOwner,
        recentBlockhash: blockhash,
        instructions: [swapIx]
      }).compileToV0Message();

      return new VersionedTransaction(message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to build swap transaction: ${message}`);
      throw error;
    }
  }
}
