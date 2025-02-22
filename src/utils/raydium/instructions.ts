import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { BN } from 'bn.js';
import { BigNumber } from './types';
import { Buffer } from 'buffer';

// Raydium instruction discriminators
export enum RaydiumInstruction {
  Swap = 9,
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
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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

// Helper function to derive token account address
export const findAssociatedTokenAddress = async (
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> => {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      SystemProgram.programId.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
  )[0];
};
