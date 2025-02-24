import { 
  Connection, 
  PublicKey, 
  VersionedTransaction, 
  TransactionMessage,
  MessageV0
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { RaydiumPool } from './pool';
import { 
  RaydiumError, 
  SwapParams, 
  SwapResult, 
  RaydiumPoolConfig, 
  BigNumber,
  RaydiumPoolState,
  PoolStateChange 
} from './types';
import { 
  createSwapInstruction, 
  findPoolAuthorityPDA,
  findAssociatedTokenAddress,
  SwapInstructionAccounts 
} from './instructions';

export class RaydiumClient {
  protected pools: Map<string, RaydiumPool> = new Map();

  constructor(
    readonly connection: Connection,
    readonly programId: PublicKey
  ) {}

  async createPool(config: RaydiumPoolConfig): Promise<RaydiumPool> {
    try {
      const poolId = new PublicKey(config.id);
      const pool = new RaydiumPool(
        this.connection,
        poolId,
        (change: PoolStateChange) => console.log('Pool state change:', change)
      );
      
      // Verify pool exists and is accessible
      await pool.fetchPoolState();
      
      this.pools.set(config.id, pool);
      return pool;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RaydiumError(
        `Failed to create pool: ${message}`,
        'POOL_CREATION_FAILED'
      );
    }
  }

  async swap(params: SwapParams): Promise<SwapResult> {
    try {
      const pool = this.pools.get(params.poolId.toString());
      if (!pool) {
        throw new RaydiumError('Pool not found', 'POOL_NOT_FOUND');
      }

      const poolState = await pool.fetchPoolState();
      if (!poolState) {
        throw new RaydiumError('Failed to fetch pool state', 'POOL_STATE_ERROR');
      }

      // Calculate amounts and price impact
      const { amountOut, priceImpact, fee } = this.calculateSwap(
        poolState,
        params.amountIn,
        params.isBaseInput
      );

      // Verify slippage
      if (amountOut.lt(params.minAmountOut)) {
        throw new RaydiumError(
          'Swap would exceed maximum slippage',
          'EXCESSIVE_SLIPPAGE'
        );
      }

      // Build and send transaction
      const transaction = await this.buildSwapTransaction(params, poolState);
      const signature = await this.connection.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      const result: SwapResult = {
        signature,
        amountIn: params.amountIn,
        amountOut,
        priceImpact,
        fee,
        timestamp: Date.now()
      };

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RaydiumError(`Swap failed: ${message}`, 'SWAP_FAILED');
    }
  }

  calculateSwap(
    poolState: RaydiumPoolState,
    amountIn: BigNumber,
    isBaseInput: boolean
  ): {
    amountOut: BigNumber;
    priceImpact: number;
    fee: BigNumber;
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
    amountIn: BigNumber,
    amountOut: BigNumber,
    inputReserve: BigNumber,
    outputReserve: BigNumber
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
    params: SwapParams,
    poolState: RaydiumPoolState
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
      throw new RaydiumError(
        `Failed to build swap transaction: ${message}`,
        'BUILD_TRANSACTION_FAILED'
      );
    }
  }

  async getPool(poolId: string): Promise<RaydiumPool | undefined> {
    return this.pools.get(poolId);
  }

  getAllPools(): RaydiumPool[] {
    return Array.from(this.pools.values());
  }
}
