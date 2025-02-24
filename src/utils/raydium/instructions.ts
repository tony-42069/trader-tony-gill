import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { BN } from 'bn.js';
import { BigNumber } from './types';
import { Buffer } from 'buffer';

// Constants
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Raydium instruction discriminators
export enum RaydiumInstruction {
  Initialize = 0,
  Swap = 9,
  DepositAllTokenTypes = 3,
  WithdrawAllTokenTypes = 4,
  DepositSingleTokenType = 5,
  WithdrawSingleTokenType = 6,
}

// Account metas for swap instruction
export interface SwapInstructionAccounts {
  poolId: PublicKey;
  tokenAccountA: PublicKey;
  tokenAccountB: PublicKey;
  tokenPool: PublicKey;
  authority: PublicKey;
  userSourceToken: PublicKey;
  userDestinationToken: PublicKey;
  userOwner: PublicKey;
}

export const createSwapInstruction = (
  programId: PublicKey,
  accounts: SwapInstructionAccounts,
  amountIn: BigNumber,
  minAmountOut: BigNumber
): TransactionInstruction => {
  const keys = [
    { pubkey: accounts.poolId, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenAccountA, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenAccountB, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenPool, isSigner: false, isWritable: true },
    { pubkey: accounts.authority, isSigner: false, isWritable: false },
    { pubkey: accounts.userSourceToken, isSigner: false, isWritable: true },
    { pubkey: accounts.userDestinationToken, isSigner: false, isWritable: true },
    { pubkey: accounts.userOwner, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  // Instruction data layout:
  // 1 byte - instruction discriminator (Swap = 9)
  // 8 bytes - amount in (u64)
  // 8 bytes - minimum amount out (u64)
  const data = Buffer.alloc(17);
  data.writeUInt8(RaydiumInstruction.Swap, 0);
  data.writeBigUInt64LE(BigInt(amountIn.toString()), 1);
  data.writeBigUInt64LE(BigInt(minAmountOut.toString()), 9);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

// Helper function to derive pool authority PDA
export const findPoolAuthorityPDA = async (
  poolId: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), poolId.toBuffer()],
    programId
  );
};

// Helper function to derive associated token account address
export const findAssociatedTokenAddress = async (
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> => {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
};
