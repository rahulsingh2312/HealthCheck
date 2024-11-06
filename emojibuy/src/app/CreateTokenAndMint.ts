import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountIdempotent,
  ExtensionType,
  getMintLen
} from '@solana/spl-token';

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
} from '@solana/spl-token-metadata';

async function createTokenAndMint(
  metadata: any,
  wallet: { 
    publicKey: PublicKey; 
    signTransaction?: (tx: Transaction) => Promise<Transaction>; 
  }
): Promise<[string, string]> {
  const connection = new Connection("https://devnet.helius-rpc.com/?api-key=215399cd-1d50-4bdf-8637-021503ae6ef3", 'confirmed');
  
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  console.log('Creating token with mint:', mint.toBase58());

  try {
    // Step 1: Create mint account
    const extensions = [ExtensionType.MetadataPointer];
    const mintSpace = getMintLen(extensions);
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

    const createAccountTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint,
        space: mintSpace,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    createAccountTx.recentBlockhash = blockhash;
    createAccountTx.feePayer = wallet.publicKey;
    createAccountTx.sign(mintKeypair);

    if (!wallet.signTransaction) {
      throw new Error('wallet.signTransaction is undefined');
    }
    const signedCreateAccountTx = await wallet.signTransaction(createAccountTx);
    const createAccountSig = await connection.sendRawTransaction(
      signedCreateAccountTx.serialize(),
      { skipPreflight: false }
    );
    await connection.confirmTransaction(createAccountSig);
    console.log('Account created:', createAccountSig);

    // Step 2: Initialize mint with metadata pointer
    const initMintTx = new Transaction().add(
      createInitializeMintInstruction(
        mint,
        6, // decimals
        wallet.publicKey,
        null, // freeze authority
        TOKEN_2022_PROGRAM_ID
      )
    );

    const mintBlockhash = await connection.getLatestBlockhash();
    initMintTx.recentBlockhash = mintBlockhash.blockhash;
    initMintTx.feePayer = wallet.publicKey;

    const signedInitMintTx = await wallet.signTransaction(initMintTx);
    const initMintSig = await connection.sendRawTransaction(
      signedInitMintTx.serialize(),
      { skipPreflight: false }
    );
    await connection.confirmTransaction(initMintSig);
    console.log('Mint initialized:', initMintSig);

    // Step 3: Initialize metadata pointer
    const metadataPointerTx = new Transaction().add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: wallet.publicKey,
        mint: mint,
        mintAuthority: wallet.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
      })
    );

    if (metadata.socials?.twitter || metadata.socials?.website) {
      metadataPointerTx.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: wallet.publicKey,
          field: metadata.socials.twitter || '',
          value: metadata.socials.website || '',
        })
      );
    }

    const metadataBlockhash = await connection.getLatestBlockhash();
    metadataPointerTx.recentBlockhash = metadataBlockhash.blockhash;
    metadataPointerTx.feePayer = wallet.publicKey;

    const signedMetadataPointerTx = await wallet.signTransaction(metadataPointerTx);
    const metadataPointerSig = await connection.sendRawTransaction(
      signedMetadataPointerTx.serialize(),
      { skipPreflight: false }
    );
    await connection.confirmTransaction(metadataPointerSig);
    console.log('Metadata pointer initialized:', metadataPointerSig);

    // Step 4: Mint tokens
    const sourceAccount = await createAssociatedTokenAccountIdempotent(
      connection,
      wallet as any,
      mint,
      wallet.publicKey,
      {},
      TOKEN_2022_PROGRAM_ID
    );

    const mintTokensTx = new Transaction().add(
      createMintToInstruction(
        mint,
        sourceAccount,
        wallet.publicKey,
        parseInt(metadata.price || '1000000'),
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    const mintTokensBlockhash = await connection.getLatestBlockhash();
    mintTokensTx.recentBlockhash = mintTokensBlockhash.blockhash;
    mintTokensTx.feePayer = wallet.publicKey;

    const signedMintTokensTx = await wallet.signTransaction(mintTokensTx);
    const mintTokensSig = await connection.sendRawTransaction(
      signedMintTokensTx.serialize(),
      { skipPreflight: false }
    );
    await connection.confirmTransaction(mintTokensSig);
    console.log('Tokens minted:', mintTokensSig);

    return [createAccountSig, mintTokensSig];

  } catch (error) {
    console.error('Detailed error:', error);
    if (error ) {
      console.error('Transaction Logs:', error);
    }
    throw error;
  }
}

export default createTokenAndMint;
