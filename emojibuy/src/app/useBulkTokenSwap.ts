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
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=a95e3765-35c7-459e-808a-9135a21acdf6', "confirmed");
const jupiterQuoteApi = createJupiterApiClient();

const FIRST_WALLET_ADDRESS = '6GsgBsVb7GRSDFTLEG5tRf1UaNEvUu82zpho4ErVjbDA';
// const SECOND_WALLET_ADDRESS = 'raePZeqhCfshJA7NEDb5v1XcoDMNiiVeKDoDK3D6zP5';

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
  // secondWalletFee: number;
}

const calculateFeesWithNoise = (totalAmount: number): Fees => {
  const baseAmount = totalAmount;
  const totalFee = baseAmount;
  const firstWalletFee = Math.floor(totalFee * 0.05 * 1e9);
  // const secondWalletFee = Math.floor(totalFee * 0.000003 * 1e9);
  
  return {
    firstWalletFee,
    // secondWalletFee
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
      }),
      // SystemProgram.transfer({
      //   fromPubkey: publicKey,
      //   toPubkey: new PublicKey(SECOND_WALLET_ADDRESS),
      //   lamports: fees.secondWalletFee,
      // })
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
        maxRetries: 50, // Aggressive retries
      }
    );
  };

  const aggressiveTransactionConfirmation = async (signature: string, maxAttempts = 100): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err === null) {
          const txInfo = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          return !txInfo?.meta?.err;
        }

        // If transaction failed, wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } catch (err) {
        console.warn(`Confirmation attempt ${attempt} failed:`, err);
        
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return false;
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
  ): Promise<{ signature: string; tokenId: string }> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }
  
    try {
      const swapResponse = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          dynamicComputeUnitLimit: true,
          dynamicSlippage: {
            maxBps: 10000, 
          },
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 100000000,
          priorityLevel: "veryHigh" 
            },
          },
        },
      });
  
      if (!swapResponse?.swapTransaction) {
        throw new Error(`Failed to get swap transaction for token ${token.id}`);
      }
  
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  
      const signedTransaction = await signTransaction(transaction);
  
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 50, // Aggressive retries
      });
  
      return {
        signature,
        tokenId: token.id,
      };
    } catch (err) {
      console.error(`Transaction error for token ${token.id}:`, err);
      throw new Error(err instanceof Error ? err.message : 'Unknown transaction error');
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
    setProcessingFees(true);
  
    try {
      // Process fee transaction with aggressive retries
      const feeSignature = await processFeeTransaction(tokens);
      
      // Confirm fee transaction aggressively
      const feeConfirmed = await aggressiveTransactionConfirmation(feeSignature);
      
      if (!feeConfirmed) {
        throw new Error('Fee transaction persistently failed');
      }
      setProcessingFees(false);
  
      const results: SwapResult[] = [];
      const confirmationPromises: Promise<void>[] = [];
  
      // Process all swaps with maximum possible confirmation attempts
      for (let i = 0; i < tokens.length; i++) {
        setCurrentTokenIndex(i + 1);
  
        try {
          const quote = await getSwapQuote(tokens[i]);
          const signedTransaction = await processTransaction(quote, tokens[i]);
  
          const confirmationPromise = aggressiveTransactionConfirmation(signedTransaction.signature)
            .then((confirmed) => {
              results.push({
                signature: signedTransaction.signature,
                tokenId: tokens[i].id,
                status: confirmed ? 'success' : 'error',
                error: confirmed ? undefined : 'Transaction persistently failed',
                feeSignature,
              });
  
              setSwapResults([...results]);
            })
            .catch((err) => {
              console.error(`Confirmation error for token ${tokens[i].id}:`, err);
              results.push({
                signature: signedTransaction.signature,
                tokenId: tokens[i].id,
                status: 'error',
                error: err instanceof Error ? err.message : 'Unknown confirmation error',
                feeSignature,
              });
  
              setSwapResults([...results]);
            });
  
          confirmationPromises.push(confirmationPromise);
        } catch (err) {
          console.error(`Error processing token ${tokens[i].id}:`, err);
          results.push({
            signature: '',
            tokenId: tokens[i].id,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown processing error',
            feeSignature,
          });
  
          setSwapResults([...results]);
        }
      }
  
      // Wait for all confirmations to complete
      await Promise.all(confirmationPromises);
  
      const failedSwaps = results.filter((r) => r.status === 'error');
      if (failedSwaps.length > 0) {
        setError(`${failedSwaps.length} swap(s) failed`);
      }
  
      return results;
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