import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Signer,
} from '@solana/web3.js';

import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountIdempotent,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  getMintLen,
  ExtensionType,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { initSdk, txVersion } from './config';

const endpoint = "https://twilight-delicate-violet.solana-devnet.quiknode.pro/65d907cbead451af0859c2f52234083774da6f4b/";
const connection = new Connection(endpoint, 'finalized');

async function createTokenAndMint(
  metadata: any,
  wallet: {
    publicKey: PublicKey;
    signTransaction?: (tx: Transaction) => Promise<Transaction>;
  }
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or doesn't support signing");
  }

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const tokenMetadata: TokenMetadata = {
    updateAuthority: wallet.publicKey,
    mint: mint,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    additionalMetadata: [['', '']],
  };

  const decimals = 6;
  const mintAmount = 21000000_000_000; // Supply 21M 
  const extensions = [ExtensionType.MetadataPointer, ExtensionType.TransferFeeConfig];
  const mintLen = getMintLen(extensions);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
  const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
  const feeBasisPoints = 200;
  const maxFee = BigInt(5000 * 10 ** decimals);

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint,
      wallet.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mint,
      decimals,
      wallet.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: wallet.publicKey,
      mint: mint,
      mintAuthority: wallet.publicKey,
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      uri: tokenMetadata.uri,
    })
  );

  // Sign and send the transaction
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = wallet.publicKey;
  
  // First, have the wallet sign
  const signedTx = await wallet.signTransaction(transaction);
  // Then, have the mintKeypair sign
  signedTx.partialSign(mintKeypair);
  
  const initSig = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(initSig);
  console.log(`Transaction: ${generateExplorerUrl(initSig)}`);

    // Create associated token account
    const associatedToken = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
  
    const ataTransaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,  // payer
        associatedToken,   // ata
        wallet.publicKey,  // owner
        mint,             // mint
        TOKEN_2022_PROGRAM_ID
      )
    );
  
  
  // ataTransaction.add(ataInstruction);
  ataTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  ataTransaction.feePayer = wallet.publicKey;
  
  const signedAtaTx = await wallet.signTransaction(ataTransaction);
  const ataSig = await connection.sendRawTransaction(signedAtaTx.serialize());
  await connection.confirmTransaction(ataSig);

  // Get the created ATA address
  const sourceAccount = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Create mint transaction
  const mintTx = new Transaction().add(
    createMintToInstruction(
      mint,
      sourceAccount,
      wallet.publicKey,
      mintAmount,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  mintTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  mintTx.feePayer = wallet.publicKey;
  
  const signedMintTx = await wallet.signTransaction(mintTx);
  const mintSig = await connection.sendRawTransaction(signedMintTx.serialize());
  await connection.confirmTransaction(mintSig);
  console.log(`Mint Transaction: ${generateExplorerUrl(mintSig)}`);

 // Create WSOL token account and fund it
 const wrappedSolMint = new PublicKey('So11111111111111111111111111111111111111112');
 const wrappedSolAccount = await getAssociatedTokenAddress(
   wrappedSolMint,
   wallet.publicKey,
   false
 );

 // Check if WSOL account exists, if not create it
 try {
   const wsolAccountInfo = await connection.getAccountInfo(wrappedSolAccount);
   if (!wsolAccountInfo) {
     const createWSOLAtaTx = new Transaction().add(
       createAssociatedTokenAccountInstruction(
         wallet.publicKey,
         wrappedSolAccount,
         wallet.publicKey,
         wrappedSolMint
       )
     );
     createWSOLAtaTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
     createWSOLAtaTx.feePayer = wallet.publicKey;
     
     const signedWSOLAtaTx = await wallet.signTransaction(createWSOLAtaTx);
     const wsolAtaSig = await connection.sendRawTransaction(signedWSOLAtaTx.serialize());
     await connection.confirmTransaction(wsolAtaSig);
   }
 } catch (error) {
   console.log("WSOL account might already exist, continuing...");
 }

 // Create Pool
 try {
   const raydium = await initSdk({ loadToken: true });
   
   const mintA = await raydium.token.getTokenInfo(mint.toBase58());
   const mintB = await raydium.token.getTokenInfo('So11111111111111111111111111111111111111112');

   const feeConfigs = await raydium.api.getCpmmConfigs();

   if (raydium.cluster === 'devnet') {
     feeConfigs.forEach((config) => {
       config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58();
     });
   }

   const { execute, extInfo } = await raydium.cpmm.createPool({
     programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
     poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
     mintA,
     mintB,
     mintAAmount: new BN(mintAmount),    // Full amount minted
     mintBAmount: new BN(1_000_000),     // 1 SOL
     startTime: new BN(0),
     feeConfig: feeConfigs[0],
     associatedOnly: true,               // Changed to true
     ownerInfo: {
       feePayer: wallet.publicKey,
       useSOLBalance: true,
     },
     txVersion,
   });

   const { txId } = await execute({ sendAndConfirm: true });
   console.log('Pool created', {
     txId,
     poolKeys: Object.keys(extInfo.address).reduce(
       (acc, cur) => ({
         ...acc,
         [cur]: extInfo.address[cur as keyof typeof extInfo.address].toString(),
       }),
       {}
     ),
   });

   return { 
     mint: mint.toBase58(), 
     initSig, 
     ataSig, 
     mintSig,
     poolTxId: txId,
     associatedToken: associatedToken.toBase58()
   };

 } catch (error) {
   console.error('Error creating pool:', error);
   throw error;
 }
}


function generateExplorerUrl(identifier: string, isAddress: boolean = false): string {
  if (!identifier) return '';
  const baseUrl = 'https://explorer.solana.com';
  const localSuffix = '?cluster=devnet';
  const slug = isAddress ? 'address' : 'tx';
  return `${baseUrl}/${slug}/${identifier}${localSuffix}`;
}

export default createTokenAndMint;