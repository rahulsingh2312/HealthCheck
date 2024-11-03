import React, { useState } from 'react';
import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  TransactionMessage, 
  VersionedTransaction,
  SendTransactionError
} from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { useWallet } from '@solana/wallet-adapter-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const connection = new Connection(
  'https://mainnet.helius-rpc.com/?api-key=215399cd-1d50-4bdf-8637-021503ae6ef3',
  "confirmed"
);
const jupiterQuoteApi = createJupiterApiClient();

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
}

export const useBulkTokenSwap = () => {
  const { publicKey, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapResults, setSwapResults] = useState<SwapResult[]>([]);

  const getSwapQuotes = async (tokens: TokenSwapInfo[]) => {
    try {
      const quotes: QuoteResponse[] = [];
      
      for (const token of tokens) {
        if (!PublicKey.isOnCurve(token.id)) {
          throw new Error(`Invalid token address: ${token.id}`);
        }

        const amountInLamports = Math.floor(token.amount * 1000000000);
        
        const quoteParams = {
          inputMint: SOL_MINT,
          outputMint: token.id,
          amount: amountInLamports,
        };

        const quote = await jupiterQuoteApi.quoteGet(quoteParams);
        
        if (!quote) {
          throw new Error(`Failed to get quote for token ${token.id}`);
        }

        quotes.push(quote);
      }

      return quotes;
    } catch (err) {
      console.error('Quote fetch error:', err);
      throw new Error('Failed to get swap quotes');
    }
  };

  const getSwapTransactions = async (quotes: QuoteResponse[], tokens: TokenSwapInfo[]) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const transactions: VersionedTransaction[] = [];

    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      
      const swapResponse = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        },
      });

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error(`Failed to get swap transaction for token ${tokens[i].id}`);
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      transactions.push(transaction);
    }

    return transactions;
  };

  const executeBulkSwap = async (tokens: TokenSwapInfo[]) => {
    if (!publicKey || !signAllTransactions) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setSwapResults([]);

    try {
      // Get all quotes first
      const quotes = await getSwapQuotes(tokens);
      
      // Get all transactions
      const transactions = await getSwapTransactions(quotes, tokens);
      
      // Sign all transactions in one batch
      const signedTransactions = await signAllTransactions(transactions);
      
      // Send all transactions and collect signatures
      const results: SwapResult[] = [];
      
      for (let i = 0; i < signedTransactions.length; i++) {
        try {
          const signature = await connection.sendRawTransaction(
            signedTransactions[i].serialize(),
            {
              skipPreflight: false,
              maxRetries: 2,
              preflightCommitment: 'confirmed'
            }
          );

          // Wait for confirmation
          const confirmation = await connection.confirmTransaction({
            signature,
            lastValidBlockHeight: await connection.getBlockHeight(),
            blockhash: (await connection.getLatestBlockhash()).blockhash
          }, 'confirmed');

          results.push({
            signature,
            tokenId: tokens[i].id,
            status: confirmation.value.err ? 'error' : 'success',
            error: confirmation.value.err?.toString()
          });

        } catch (err) {
          results.push({
            signature: '',
            tokenId: tokens[i].id,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error occurred'
          });
        }
      }

      setSwapResults(results);
      
      const failedSwaps = results.filter(r => r.status === 'error');
      if (failedSwaps.length > 0) {
        setError(`${failedSwaps.length} swap(s) failed. Check swapResults for details.`);
      }

      return results;

    } catch (err) {
      console.error('Bulk swap error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bulk swap failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeBulkSwap,
    loading,
    error,
    swapResults,
  };
};