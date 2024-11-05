import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  mintTo,
  createAssociatedTokenAccountIdempotent,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  createUpdateFieldInstruction,
  getMintLen,
  ExtensionType,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
const createTokenAndMint = async (metadata: any, wallet: any): Promise<[string, string]> => {
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=215399cd-1d50-4bdf-8637-021503ae6ef3", 'confirmed');
    const admin = wallet.publicKey;
    const mintKeypair = Keypair.generate();
    console.log('mintKeypair', mintKeypair.publicKey.toBase58());
    const mint = mintKeypair.publicKey;
  
    const mintLen = await getMintLen([ExtensionType.MetadataPointer]);
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: admin,
        newAccountPubkey: mint,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mint,
        admin,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(
        mint,
        6, // Decimals
        admin,
        null,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: admin,
        mint: mint,
        mintAuthority: admin,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: admin,
        field: metadata.socials.twitter || '',
        value: metadata.socials.website || '',
      }),
    );
  
    // Fetch and set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = admin;
  
    const signers = [mintKeypair];
    
    try {
      // Sign transaction with the wallet
      const txn = await wallet.signAllTransactions([transaction]);
      const initSig = await sendAndConfirmTransaction(connection, txn[0], signers, { commitment: 'confirmed', skipPreflight: false });
  
      // Create and fund associated token account
      const sourceAccount = await createAssociatedTokenAccountIdempotent(
        connection, wallet, mint, wallet.publicKey, {}, TOKEN_2022_PROGRAM_ID
      );
  
      // Send SOL to the new token account (e.g., 0.001 SOL)
      const fundTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: admin,
          toPubkey: sourceAccount,
          lamports: 0.001 * LAMPORTS_PER_SOL, // Adjust as needed
        })
      );
  
      const fundTx = await wallet.signAllTransactions([fundTransaction]);
      await sendAndConfirmTransaction(connection, fundTx[0], [wallet.payer], { commitment: 'confirmed' });
  
      // Mint tokens
      const mintSig = await mintTo(connection, wallet, mint, sourceAccount, wallet, parseInt(metadata.price) * 1_000_000);
  
      return [initSig, mintSig];
    } catch (error) {
      console.error('Failed to create token:', error);
      throw error;
    }
  };
export default createTokenAndMint;