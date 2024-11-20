import React, { useState } from 'react';
import { 
  Connection, 
  PublicKey, 
  VersionedTransaction,
} from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { useWallet } from '@solana/wallet-adapter-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=1c4915ef-e7f3-4cdb-b032-1a126a058ff8', "confirmed");
const jupiterQuoteApi = createJupiterApiClient();

const MAX_TRANSACTION_SIZE = 1232;
const TRANSACTION_TIMEOUT_MS = 4500; // 45 seconds timeout

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

interface TransactionBatch {
  transactions: VersionedTransaction[];
  tokens: TokenSwapInfo[];
}

export const useBulkTokenSwap = () => {
  const { publicKey, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapResults, setSwapResults] = useState<SwapResult[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const getSwapQuotes = async (tokens: TokenSwapInfo[]) => {
    const quotes: QuoteResponse[] = [];
    
    for (const token of tokens) {
      if (!PublicKey.isOnCurve(token.id)) {
        throw new Error(`Invalid token address: ${token.id}`);
      }

      const amountInLamports = Math.floor(token.amount * 1000000000);
      
      const quote = await jupiterQuoteApi.quoteGet({
        inputMint: SOL_MINT,
        outputMint: token.id,
        amount: amountInLamports,
        slippageBps: 900,
      });
      
      if (!quote) {
        throw new Error(`Failed to get quote for token ${token.id}`);
      }

      quotes.push(quote);
    }

    return quotes;
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

          // Additional verification
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

  const createTransactionBatches = async (
    quotes: QuoteResponse[], 
    tokens: TokenSwapInfo[]
  ): Promise<TransactionBatch[]> => {
    if (!publicKey) throw new Error('Wallet not connected');

    const batches: TransactionBatch[] = [];
    let currentBatch: TransactionBatch = { transactions: [], tokens: [] };
    let currentBatchSize = 0;

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

      if (!swapResponse?.swapTransaction) {
        throw new Error(`Failed to get swap transaction for token ${tokens[i].id}`);
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      const transactionSize = transaction.serialize().length;

      if (currentBatchSize + transactionSize > MAX_TRANSACTION_SIZE && currentBatch.transactions.length > 0) {
        batches.push(currentBatch);
        currentBatch = { transactions: [], tokens: [] };
        currentBatchSize = 0;
      }

      currentBatch.transactions.push(transaction);
      currentBatch.tokens.push(tokens[i]);
      currentBatchSize += transactionSize;
    }

    if (currentBatch.transactions.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  };

  const processTransactionBatch = async (batch: TransactionBatch): Promise<SwapResult[]> => {
    if (!signAllTransactions) throw new Error('Wallet not connected');

    const signedTransactions = await signAllTransactions(batch.transactions);
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

        const confirmed = await confirmTransactionWithTimeout(signature);

        results.push({
          signature,
          tokenId: batch.tokens[i].id,
          status: confirmed ? 'success' : 'error',
          error: confirmed ? undefined : 'Transaction failed to confirm'
        });

      } catch (err) {
        console.error(`Transaction error for token ${batch.tokens[i].id}:`, err);
        results.push({
          signature: '',
          tokenId: batch.tokens[i].id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return results;
  };

  const executeBulkSwap = async (tokens: TokenSwapInfo[]) => {
    if (!publicKey || !signAllTransactions) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setSwapResults([]);
    setCurrentBatchIndex(0);

    try {
      const quotes = await getSwapQuotes(tokens);
      const batches = await createTransactionBatches(quotes, tokens);
      setTotalBatches(batches.length);

      let allResults: SwapResult[] = [];

      for (let i = 0; i < batches.length; i++) {
        setCurrentBatchIndex(i + 1);
        const batchResults = await processTransactionBatch(batches[i]);
        allResults = [...allResults, ...batchResults];
        setSwapResults(allResults);
      }

      const failedSwaps = allResults.filter(r => r.status === 'error');
      if (failedSwaps.length > 0) {
        setError(`${failedSwaps.length} swap(s) failed`);
      }

      return allResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk swap failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setCurrentBatchIndex(0);
      setTotalBatches(0);
    }
  };

  return {
    executeBulkSwap,
    loading,
    error,
    swapResults,
    currentBatchIndex,
    totalBatches,
  };
};