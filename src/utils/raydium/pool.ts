import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { RaydiumPoolState, PoolStateChange, PoolStatus, RaydiumError, BigNumber } from './types';

export class RaydiumPool {
  private lastState: RaydiumPoolState | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private connection: Connection,
    private poolId: PublicKey,
    private onStateChange?: (change: PoolStateChange) => void
  ) {}

  async fetchPoolState(): Promise<RaydiumPoolState> {
    try {
      const accountInfo = await this.connection.getAccountInfo(this.poolId);
      
      if (!accountInfo) {
        throw new RaydiumError('Pool account not found', 'POOL_NOT_FOUND');
      }

      // Parse pool data from account info
      const data = accountInfo.data;
      const poolState = this.parsePoolData(data);

      // Update last state and check for changes
      if (this.lastState && this.onStateChange) {
        const changes = this.calculateStateChanges(this.lastState, poolState);
        this.onStateChange(changes);
      }

      this.lastState = poolState;
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

      return {
        id: this.poolId,
        baseMint,
        quoteMint,
        lpMint,
        baseDecimals,
        quoteDecimals,
        baseReserve,
        quoteReserve,
        lpSupply,
        startTime,
        status
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
      poolId: this.poolId.toString(),
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
    return this.lastState?.status === PoolStatus.Active;
  }

  getLastState(): RaydiumPoolState | null {
    return this.lastState;
  }
}
