import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { RaydiumPoolState, PoolStateChange, PoolStatus, RaydiumError, BigNumber } from './types';

export class RaydiumPool {
  public readonly id: PublicKey;
  private _baseMint: PublicKey | null = null;
  private _quoteMint: PublicKey | null = null;
  private _lpMint: PublicKey | null = null;
  public state: RaydiumPoolState | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private connection: Connection,
    poolId: PublicKey,
    private onStateChange?: (change: PoolStateChange) => void
  ) {
    this.id = poolId;
  }

  get baseMint(): PublicKey {
    if (!this._baseMint) {
      throw new RaydiumError('Pool not initialized', 'NOT_INITIALIZED');
    }
    return this._baseMint;
  }

  get quoteMint(): PublicKey {
    if (!this._quoteMint) {
      throw new RaydiumError('Pool not initialized', 'NOT_INITIALIZED');
    }
    return this._quoteMint;
  }

  get lpMint(): PublicKey {
    if (!this._lpMint) {
      throw new RaydiumError('Pool not initialized', 'NOT_INITIALIZED');
    }
    return this._lpMint;
  }

  async fetchPoolState(): Promise<RaydiumPoolState> {
    try {
      const accountInfo = await this.connection.getAccountInfo(this.id);
      
      if (!accountInfo) {
        throw new RaydiumError('Pool account not found', 'POOL_NOT_FOUND');
      }

      // Parse pool data from account info
      const data = accountInfo.data;
      const poolState = this.parsePoolData(data);

      // Update state and check for changes
      if (this.state && this.onStateChange) {
        const changes = this.calculateStateChanges(this.state, poolState);
        this.onStateChange(changes);
      }

      // Update instance properties if not already set
      if (!this._baseMint) {
        this._baseMint = poolState.baseMint;
        this._quoteMint = poolState.quoteMint;
        this._lpMint = poolState.lpMint;
      }

      this.state = poolState;
      return poolState;
    } catch (error: unknown) {
      if (error instanceof RaydiumError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RaydiumError(
        `Failed to fetch pool state: ${message}`,
        'FETCH_FAILED'
      );
    }
  }

  private parsePoolData(data: Buffer): RaydiumPoolState {
    try {
      // Pool data layout (simplified version):
      // - status: u8
      // - nonce: u8
      // - baseMint: Pubkey (32)
      // - quoteMint: Pubkey (32)
      // - lpMint: Pubkey (32)
      // - baseDecimals: u8
      // - quoteDecimals: u8
      // - baseReserve: u64
      // - quoteReserve: u64
      // - lpSupply: u64
      // - startTime: i64

      let offset = 0;

      const status = data.readUInt8(offset);
      offset += 1;

      // Skip nonce
      offset += 1;

      const baseMint = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const quoteMint = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const lpMint = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;

      const baseDecimals = data.readUInt8(offset);
      offset += 1;

      const quoteDecimals = data.readUInt8(offset);
      offset += 1;

      const baseReserve = new BN(data.slice(offset, offset + 8), 'le');
      offset += 8;

      const quoteReserve = new BN(data.slice(offset, offset + 8), 'le');
      offset += 8;

      const lpSupply = new BN(data.slice(offset, offset + 8), 'le');
      offset += 8;

      const startTime = new BN(data.slice(offset, offset + 8), 'le');

      // Calculate market data
      const price = quoteReserve.toNumber() / baseReserve.toNumber();
      
      return {
        baseMint,
        quoteMint,
        lpMint,
        baseReserve,
        quoteReserve,
        lpSupply,
        price,
        volume24h: 0, // Would need external API for this
        liquidity: quoteReserve.toNumber() * 2, // Simplified liquidity calc
        lastUpdated: new Date(),
        fees: {
          tradeFee: 0.25, // 0.25% default Raydium fee
          ownerTradeFee: 0,
          ownerWithdrawFee: 0
        },
        status: status as PoolStatus
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new RaydiumError(
        `Failed to parse pool data: ${message}`,
        'PARSE_FAILED'
      );
    }
  }

  private calculateStateChanges(
    oldState: RaydiumPoolState,
    newState: RaydiumPoolState
  ): PoolStateChange {
    const baseReserveChange = this.calculatePercentageChange(
      oldState.baseReserve,
      newState.baseReserve
    );

    const quoteReserveChange = this.calculatePercentageChange(
      oldState.quoteReserve,
      newState.quoteReserve
    );

    const lpSupplyChange = this.calculatePercentageChange(
      oldState.lpSupply,
      newState.lpSupply
    );

    return {
      poolId: this.id.toString(),
      baseReserveChange,
      quoteReserveChange,
      lpSupplyChange,
      timestamp: Date.now()
    };
  }

  private calculatePercentageChange(oldValue: BigNumber, newValue: BigNumber): number {
    if (oldValue.isZero()) {
      return newValue.isZero() ? 0 : 100;
    }

    const change = newValue.sub(oldValue).mul(new BN(100));
    return change.div(oldValue).toNumber();
  }

  startMonitoring(interval: number = 1000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.fetchPoolState();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Pool monitoring error:', message);
      }
    }, interval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  isActive(): boolean {
    return this.state?.status === PoolStatus.Active;
  }

  async getReserves(): Promise<{ baseReserve: BigNumber; quoteReserve: BigNumber }> {
    const state = await this.fetchPoolState();
    return {
      baseReserve: state.baseReserve,
      quoteReserve: state.quoteReserve
    };
  }
}
