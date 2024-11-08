import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  mintTo,
  createAssociatedTokenAccountIdempotent,
  AuthorityType,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  getMintLen,
  ExtensionType,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
  createSetAuthorityInstruction,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';
import secret from './2vBAnVajtqmP4RBm8Vw5gzYEy3XCT9Mf1NBeQ2TPkiVF.json'
import dotenv from 'dotenv';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import base58 from 'bs58';
import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { initSdk, txVersion } from './config'

dotenv.config();

const endpoint = process.env.SOLANA_DEVNET_URL as string;
const connection = new Connection(endpoint, 'finalized');

//save your keypair file in home folder
async function createTokenAndMint(
  // metadata: any,
  // wallet: { 
  //   publicKey: PublicKey; 
  //   signTransaction?: (tx: Transaction) => Promise<Transaction>; 
  // }
){
  // const connection = useConnection();
  // const wallet = useWallet();
  const admin = Keypair.fromSecretKey(new Uint8Array(secret));
  // const privateKey = base58.encode(admin.secretKey)
  // console.log("AdminSecret:", privateKey)
  // const payer = useWallet();
  const payer = admin;
  const authority = admin;
  const owner = admin;
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const tokenMetadata: TokenMetadata = {
    updateAuthority: authority.publicKey,
    mint: mint,
    name: 'FEE-TEST-1',
    symbol: 'FEE1',
    uri: "https://dweb.link/ipfs/Qma5VS5zQ6fGusmkDME5J68MvS9MvFMV44zkxWatUmqiQ2", // URI to a richer metadata
    additionalMetadata: [['', '']],
  };

  const decimals = 6;
  const mintAmount = 21000000_000_000 // Supply 21M 
  const extensions = [ExtensionType.MetadataPointer, ExtensionType.TransferFeeConfig]
  const mintLen = getMintLen(extensions);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
  const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
  const feeBasisPoints = 200;
  const maxFee = BigInt(5000*10**decimals);

  // Prepare transaction
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint,
      authority.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      payer.publicKey,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mint,
      decimals,
      authority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: authority.publicKey,
      mint: mint,
      mintAuthority: authority.publicKey,
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      uri: tokenMetadata.uri,
    }),
  )
  const initSig = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair, authority]);
  console.log(`   ${generateExplorerUrl(initSig)}`);
// Create associated token account
  const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
// Mint Token to associated token account
  const mintSig = await mintTo(connection, payer, mint, sourceAccount, authority, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log(`   ${generateExplorerUrl(mintSig)}`);
  console.log('Token Minted to Admin Wallet')
  //Create Pool & Add LP 
  
    const raydium = await initSdk({ loadToken: true })
  
    // check token list here: https://api-v3.raydium.io/mint/list
    // RAY
    const mintA = await raydium.token.getTokenInfo(mint.toBase58());
    // USDC
    const mintB = await raydium.token.getTokenInfo('So11111111111111111111111111111111111111112')
  
    /**
     * you also can provide mint info directly like below, then don't have to call token info api
     *  {
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimals: 6,
      } 
     */
  
    const feeConfigs = await raydium.api.getCpmmConfigs()
  
    if (raydium.cluster === 'devnet') {
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58()
      })
    }
  
    const { execute, extInfo } = await raydium.cpmm.createPool({
      // poolId: // your custom publicKey, default sdk will automatically calculate pda pool id
    //   programId: CREATE_CPMM_POOL_PROGRAM, // devnet: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM
      programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
    //   poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC, // devnet:  DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC
      poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
      mintA,
      mintB,
      mintAAmount: new BN(21000000_000_000),
      mintBAmount: new BN(1000_000),
      startTime: new BN(0),
      feeConfig: feeConfigs[0],
      associatedOnly: false,
      ownerInfo: {
        useSOLBalance: true,
      },
      txVersion,
      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 100000000,
      // },
    })
  
    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true })
    console.log('pool created', {
      txId,
      poolKeys: Object.keys(extInfo.address).reduce(
        (acc, cur) => ({
          ...acc,
          [cur]: extInfo.address[cur as keyof typeof extInfo.address].toString(),
        }),
        {}
      ),
    })
    // process.exit() // if you don't want to end up node execution, comment this line
  }

function generateExplorerUrl(identifier: string, isAddress: boolean = false): string {
  if (!identifier) return '';
  const baseUrl = 'https://explorer.solana.com';
  const localSuffix = '?cluster=devnet';
  const slug = isAddress ? 'address' : 'tx';
  return `${baseUrl}/${slug}/${identifier}${localSuffix}`;
}

export default createTokenAndMint;


// (async () => {
//   await createTokenMintAddLp();
// })();