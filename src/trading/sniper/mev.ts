import { Connection, PublicKey, Transaction, Signer } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { MEVProtection, TransactionBundle, SolanaTransaction, MEVRiskLevel } from './types';

export class MEVProtector implements MEVProtection {
  // Add required properties from MEVProtection interface
  priorityFee: number = 0.000001;
  recommendedSlippage: number = 1.0;
  recommendedDelay: number = 2;
  protectionEnabled: boolean = true;
  riskLevel: MEVRiskLevel = MEVRiskLevel.LOW;
  warnings: string[] = [];

  constructor(private connection: Connection) {}

  async detectSandwich(
    bundle: TransactionBundle
  ): Promise<{
    isSandwich: boolean;
    frontRun?: SolanaTransaction;
    backRun?: SolanaTransaction;
  }> {
    try {
      const { transactions, blockNumber } = bundle;

      // Get mempool transactions
      const signatures = transactions
        .map(tx => tx.hash || '')
        .filter(hash => hash !== '');

      const pendingTxs = await this.connection.getParsedTransactions(signatures);

      // Look for sandwich patterns
      const frontRun = transactions[0];
      const backRun = transactions[transactions.length - 1];
      const targetTx = transactions[1];

      if (!frontRun || !backRun || !targetTx) {
        return { isSandwich: false };
      }

      // Check for suspicious patterns
      const isSandwich = await this.analyzeSandwichPattern(
        frontRun,
        targetTx,
        backRun,
        {
          maxGasPrice: bundle.config?.maxGasPrice || 0,
          priorityFee: bundle.config?.priorityFee || 0,
          computeUnits: bundle.config?.computeUnits || 0,
          maxBlockAge: bundle.config?.maxBlockAge || 150 // Default block age threshold
        }
      );

      return {
        isSandwich,
        frontRun: isSandwich ? frontRun : undefined,
        backRun: isSandwich ? backRun : undefined
      };

    } catch (error) {
      logger.error('Failed to detect sandwich:', error);
      return { isSandwich: false };
    }
  }

  async optimizeGas(
    tokenAddress: string,
    amount: number
  ): Promise<{
    priorityFee: number;
    computeUnits: number;
  }> {
    try {
      // Get recent block data
      const { blockhash } = await this.connection.getLatestBlockhash();

      // Get recent transactions for the token
      const tokenPubkey = new PublicKey(tokenAddress);
      const recentTxs = await this.connection.getConfirmedSignaturesForAddress2(
        tokenPubkey,
        { limit: 100 }
      );

      // Calculate average fees from recent transactions
      const txDetails = await Promise.all(
        recentTxs.map(tx => this.connection.getTransaction(tx.signature))
      );

      const avgFee = txDetails.reduce((sum, tx) => {
        return sum + (tx?.meta?.fee || 0);
      }, 0) / txDetails.length;

      // Calculate optimal compute units based on transaction complexity
      const estimatedComputeUnits = Math.min(
        200000, // Maximum allowed
        100000 + (amount * 1000) // Base + scaling factor
      );

      // Update the priorityFee property
      this.priorityFee = Math.max(avgFee * 1.2, 0.000001); // 20% above average

      return {
        priorityFee: this.priorityFee,
        computeUnits: estimatedComputeUnits
      };

    } catch (error) {
      logger.error('Failed to optimize gas:', error);
      return {
        priorityFee: 0.000001,
        computeUnits: 200000
      };
    }
  }

  async bundleTransactions(
    transactions: SolanaTransaction[]
  ): Promise<TransactionBundle> {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    
    return {
      transactions,
      blockNumber: lastValidBlockHeight,
      timestamp: Date.now(),
      config: {
        maxGasPrice: 100000, // Default max gas price
        priorityFee: this.priorityFee, // Use the class property
        computeUnits: 200000, // Default compute units
        maxBlockAge: 150 // Default block age threshold
      }
    };
  }

  async submitToPrivatePool(
    bundle: TransactionBundle
  ): Promise<string[]> {
    try {
      const signatures: string[] = [];
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      for (const solTx of bundle.transactions) {
        if (solTx.signers && solTx.signers.length > 0) {
          const tx = new Transaction();
          tx.recentBlockhash = blockhash;
          const signer = solTx.signers[0];
          if (!signer || !signer.publicKey) {
            logger.error('Invalid signer in transaction');
            continue;
          }
          tx.feePayer = signer.publicKey;
          
          // Add instructions if they exist
          if (solTx.instructions) {
            for (const instruction of solTx.instructions) {
              tx.add(instruction);
            }
          }

          // Sign and send
          const signature = await this.connection.sendTransaction(
            tx,
            solTx.signers
          );
          signatures.push(signature);
        }
      }

      return signatures;
    } catch (error) {
      logger.error('Failed to submit to private pool:', error);
      throw error;
    }
  }

  // Update MEV protection settings based on risk assessment
  updateProtectionSettings(riskLevel: MEVRiskLevel): void {
    this.riskLevel = riskLevel;
    
    switch (riskLevel) {
      case MEVRiskLevel.HIGH:
        this.recommendedSlippage = 2.0;
        this.recommendedDelay = 5;
        this.warnings = [
          'High MEV risk detected',
          'Consider increasing slippage tolerance',
          'Consider delaying transaction execution'
        ];
        break;
      case MEVRiskLevel.MEDIUM:
        this.recommendedSlippage = 1.5;
        this.recommendedDelay = 3;
        this.warnings = [
          'Medium MEV risk detected',
          'Consider moderate slippage tolerance'
        ];
        break;
      case MEVRiskLevel.LOW:
      default:
        this.recommendedSlippage = 1.0;
        this.recommendedDelay = 2;
        this.warnings = [];
        break;
    }
  }

  private async analyzeSandwichPattern(
    frontRun: SolanaTransaction,
    targetTx: SolanaTransaction,
    backRun: SolanaTransaction,
    config: {
      maxGasPrice: number;
      priorityFee: number;
      computeUnits: number;
      maxBlockAge: number;
    }
  ): Promise<boolean> {
    // Check priority fees
    const frontPriorityFee = frontRun.priorityFee || 0;
    const targetPriorityFee = targetTx.priorityFee || 0;
    const backPriorityFee = backRun.priorityFee || 0;

    if (
      frontPriorityFee > config.priorityFee * 1.5 ||
      backPriorityFee > config.priorityFee * 1.5
    ) {
      // Update risk level and protection settings
      this.updateProtectionSettings(MEVRiskLevel.HIGH);
      return true;
    }

    // Check for suspicious patterns
    const sameFrom = frontRun.from === backRun.from;
    const sameValue = frontRun.value === backRun.value;
    const suspiciousTiming =
      Math.abs(
        Number(frontRun.hash?.slice(0, 8) || 0) - 
        Number(backRun.hash?.slice(0, 8) || 0)
      ) < config.maxBlockAge;

    const isSandwich = sameFrom || (sameValue && suspiciousTiming);
    
    // Update risk level based on analysis
    if (isSandwich) {
      this.updateProtectionSettings(MEVRiskLevel.HIGH);
    } else if (suspiciousTiming) {
      this.updateProtectionSettings(MEVRiskLevel.MEDIUM);
    } else {
      this.updateProtectionSettings(MEVRiskLevel.LOW);
    }
    
    return isSandwich;
  }
}
