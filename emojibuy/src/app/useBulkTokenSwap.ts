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

// Maximum size for a transaction batch (in bytes)
const MAX_TRANSACTION_SIZE = 1232;

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
        console.error(`Transaction failed: ${confirmation.value.err.toString()}`);
        return false;
      }

      // Additional verification of transaction success
      const txInfo = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo?.meta) {
        console.error('Transaction info not found');
        return false;
      }

      // Check if transaction was successful
      if (txInfo.meta.err) {
        console.error(`Transaction error: ${txInfo.meta.err.toString()}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Transaction confirmation error:', err);
      return false;
    }
  };

  const createTransactionBatches = async (quotes: QuoteResponse[], tokens: TokenSwapInfo[]): Promise<TransactionBatch[]> => {
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

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error(`Failed to get swap transaction for token ${tokens[i].id}`);
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Calculate size of serialized transaction
      const transactionSize = transaction.serialize().length;

      // If adding this transaction would exceed batch size limit, create new batch
      if (currentBatchSize + transactionSize > MAX_TRANSACTION_SIZE && currentBatch.transactions.length > 0) {
        batches.push(currentBatch);
        currentBatch = { transactions: [], tokens: [] };
        currentBatchSize = 0;
      }

      currentBatch.transactions.push(transaction);
      currentBatch.tokens.push(tokens[i]);
      currentBatchSize += transactionSize;
    }

    // Add the last batch if it contains any transactions
    if (currentBatch.transactions.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  };

  const processTransactionBatch = async (batch: TransactionBatch): Promise<SwapResult[]> => {
    if (!signAllTransactions) throw new Error('Wallet not connected');

    const results: SwapResult[] = [];
    
    // Sign all transactions in the batch
    const signedTransactions = await signAllTransactions(batch.transactions);
    
    // Process each signed transaction
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

        // Wait for confirmation with additional verification
        const confirmed = await confirmTransaction(signature);

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
          error: err instanceof Error ? err.message : 'Unknown error occurred'
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
      // Get all quotes first
      const quotes = await getSwapQuotes(tokens);
      
      // Create transaction batches
      const batches = await createTransactionBatches(quotes, tokens);
      setTotalBatches(batches.length);

      let allResults: SwapResult[] = [];

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        setCurrentBatchIndex(i + 1);
        const batchResults = await processTransactionBatch(batches[i]);
        allResults = [...allResults, ...batchResults];
        setSwapResults(allResults); // Update results after each batch
      }

      const failedSwaps = allResults.filter(r => r.status === 'error');
      if (failedSwaps.length > 0) {
        setError(`${failedSwaps.length} swap(s) failed. Check swapResults for details.`);
      }

      return allResults;

    } catch (err) {
      console.error('Bulk swap error:', err);
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