import { Connection } from '@solana/web3.js';
import { RaydiumClient } from '../../utils/raydium/client';
import { HoneypotAnalyzer, HoneypotAnalysis } from './honeypot';
import { OwnershipAnalyzer, OwnershipAnalysis } from './ownership';
import { HolderAnalyzer, HolderAnalysis } from './holders';
import { TaxAnalyzer, TaxAnalysis } from './tax';

export interface ContractAnalysis {
  riskScore: number;
  honeypot: HoneypotAnalysis;
  ownership: OwnershipAnalysis;
  holders: HolderAnalysis;
  tax: TaxAnalysis;
  warnings: string[];
}

export class ContractAnalyzer {
  private honeypotAnalyzer: HoneypotAnalyzer;
  private ownershipAnalyzer: OwnershipAnalyzer;
  private holderAnalyzer: HolderAnalyzer;
  private taxAnalyzer: TaxAnalyzer;

  constructor(
    connection: Connection,
    raydiumClient: RaydiumClient
  ) {
    this.honeypotAnalyzer = new HoneypotAnalyzer(connection, raydiumClient);
    this.ownershipAnalyzer = new OwnershipAnalyzer(connection);
    this.holderAnalyzer = new HolderAnalyzer(connection);
    this.taxAnalyzer = new TaxAnalyzer(connection, raydiumClient);
  }

  async analyzeContract(tokenAddress: string): Promise<ContractAnalysis> {
    const [honeypot, ownership, holders, tax] = await Promise.all([
      this.honeypotAnalyzer.analyzeToken(tokenAddress),
      this.ownershipAnalyzer.analyzeToken(tokenAddress),
      this.holderAnalyzer.analyzeToken(tokenAddress),
      this.taxAnalyzer.analyzeToken(tokenAddress)
    ]);

    // Combine warnings from all analyzers
    const warnings = [
      ...honeypot.warnings,
      ...ownership.warnings,
      ...holders.warnings,
      ...tax.warnings
    ];

    // Calculate risk score based on analysis results
    const riskScore = this.calculateRiskScore({
      honeypot,
      ownership,
      holders,
      tax
    });

    return {
      riskScore,
      honeypot,
      ownership,
      holders,
      tax,
      warnings
    };
  }

  private calculateRiskScore(analysis: {
    honeypot: HoneypotAnalysis;
    ownership: OwnershipAnalysis;
    holders: HolderAnalysis;
    tax: TaxAnalysis;
  }): number {
    let score = 0;

    // Honeypot risk (40% weight)
    if (analysis.honeypot.isHoneypot) {
      score += 40;
    } else {
      score += (analysis.honeypot.buyTax + analysis.honeypot.sellTax) * 2;
    }

    // Tax risk (20% weight)
    const taxRisk = (analysis.tax.buyTax + analysis.tax.sellTax) / 2;
    score += Math.min(taxRisk, 20);

    // Ownership risk (20% weight)
    if (!analysis.ownership.isRenounced) {
      score += 20;
    }

    // Holder concentration risk (20% weight)
    const topHolderPercentage = analysis.holders.topHolderPercentage;
    score += Math.min(topHolderPercentage / 5, 20);

    return Math.min(score, 100);
  }
}
