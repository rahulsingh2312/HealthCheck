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

  const confirmTransaction = async (signature: string): Promise<boolean> => {
    try {
      const confirmation = await connection.confirmTransaction({
        signature,
        lastValidBlockHeight: await connection.getBlockHeight(),
        blockhash: (await connection.getLatestBlockhash()).blockhash
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }

      return true;
    } catch (err) {
      console.error('Transaction confirmation error:', err);
      return false;
    }
  };

  const executeBulkSwap = async (tokens: TokenSwapInfo[]) => {
    if (!publicKey || !signAllTransactions) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setSwapResults([]);

    try {
      const quotes = await getSwapQuotes(tokens);
      const results: SwapResult[] = [];

      for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        const token = tokens[i];

        try {
          // Get swap transaction
          const swapResponse = await jupiterQuoteApi.swapPost({
            swapRequest: {
              quoteResponse: quote,
              userPublicKey: publicKey.toString(),
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: 'auto',
            },
          });

          if (!swapResponse || !swapResponse.swapTransaction) {
            throw new Error('Failed to retrieve swap transaction data');
          }

          // Deserialize and sign transaction
          const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
          const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
          const signedTx = (await signAllTransactions([transaction]))[0];

          // Send and confirm transaction
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
            preflightCommitment: 'confirmed'
          });

          // Wait for confirmation
          const confirmed = await confirmTransaction(signature);

          results.push({
            signature,
            tokenId: token.id,
            status: confirmed ? 'success' : 'error',
            error: confirmed ? undefined : 'Transaction failed to confirm'
          });

        } catch (err) {
          console.error(`Swap error for token ${token.id}:`, err);
          results.push({
            signature: '',
            tokenId: token.id,
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