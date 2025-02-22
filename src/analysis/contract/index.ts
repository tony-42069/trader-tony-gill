import { Connection } from '@solana/web3.js';
import { RaydiumClient } from '../../utils/raydium/client';
import { HoneypotAnalyzer, HoneypotAnalysis } from './honeypot';
import { OwnershipAnalyzer, OwnershipAnalysis } from './ownership';
import { HolderAnalyzer, HolderAnalysis } from './holders';

export interface ContractAnalysis {
  riskScore: number;
  honeypot: HoneypotAnalysis;
  ownership: OwnershipAnalysis;
  holders: HolderAnalysis;
  warnings: string[];
}

export class ContractAnalyzer {
  private honeypotAnalyzer: HoneypotAnalyzer;
  private ownershipAnalyzer: OwnershipAnalyzer;
  private holderAnalyzer: HolderAnalyzer;

  constructor(
    connection: Connection,
    raydiumClient: RaydiumClient
  ) {
    this.honeypotAnalyzer = new HoneypotAnalyzer(connection, raydiumClient);
    this.ownershipAnalyzer = new OwnershipAnalyzer(connection);
    this.holderAnalyzer = new HolderAnalyzer(connection);
  }

  async analyzeContract(tokenAddress: string): Promise<ContractAnalysis> {
    const [honeypot, ownership, holders] = await Promise.all([
      this.honeypotAnalyzer.analyzeToken(tokenAddress),
      this.ownershipAnalyzer.analyzeToken(tokenAddress),
      this.holderAnalyzer.analyzeToken(tokenAddress)
    ]);

    // Combine warnings from all analyzers
    const warnings = [
      ...honeypot.warnings,
      ...ownership.warnings,
      ...holders.warnings
    ];

    // Calculate risk score based on analysis results
    const riskScore = this.calculateRiskScore({
      honeypot,
      ownership,
      holders
    });

    return {
      riskScore,
      honeypot,
      ownership,
      holders,
      warnings
    };
  }

  private calculateRiskScore(analysis: {
    honeypot: HoneypotAnalysis;
    ownership: OwnershipAnalysis;
    holders: HolderAnalysis;
  }): number {
    let score = 0;

    // Honeypot risk (50% weight)
    if (analysis.honeypot.isHoneypot) {
      score += 50;
    } else {
      score += (analysis.honeypot.buyTax + analysis.honeypot.sellTax) * 2.5;
    }

    // Ownership risk (30% weight)
    if (!analysis.ownership.isRenounced) {
      score += 30;
    }

    // Holder concentration risk (20% weight)
    const topHolderPercentage = analysis.holders.topHolderPercentage;
    score += Math.min(topHolderPercentage / 5, 20);

    return Math.min(score, 100);
  }
}
