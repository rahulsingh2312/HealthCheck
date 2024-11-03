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

interface SwapResult {
  signature: string;
  status: 'success' | 'error';
  error?: string;
}

export const useSingleTokenSwap = () => {
  const { publicKey, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);

  const getSwapQuote = async (tokenAddress: string, amountInSol: number) => {
    try {
      if (!PublicKey.isOnCurve(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const amountInLamports = Math.floor(amountInSol * 1000000000);

      const quoteParams = {
        inputMint: SOL_MINT,
        outputMint: tokenAddress,
        amount: amountInLamports,
      };

      const quote = await jupiterQuoteApi.quoteGet(quoteParams);

      if (!quote) {
        throw new Error('Failed to get valid quote data');
      }

      return quote;
    } catch (err) {
      console.error('Quote fetch error:', err);
      throw new Error('Failed to get swap quote');
    }
  };

  const confirmTransaction = async (signature: string): Promise<boolean> => {
    try {
      const latestBlockhash = await connection.getLatestBlockhash();
      
      const confirmation = await connection.confirmTransaction({
        signature,
        lastValidBlockHeight: await connection.getBlockHeight(),
        blockhash: latestBlockhash.blockhash
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }

      // Verify transaction was successful
      const txResponse = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!txResponse || txResponse.meta?.err) {
        throw new Error('Transaction verification failed');
      }

      return true;
    } catch (err) {
      console.error('Transaction confirmation error:', err);
      return false;
    }
  };

  const executeSwap = async (tokenAddress: string, amountInSol: number): Promise<SwapResult> => {
    if (!publicKey || !signAllTransactions) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setSwapResult(null);

    try {
      // Get swap quote
      const quote = await getSwapQuote(tokenAddress, amountInSol);
      console.log('Received quote:', quote);

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

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign transaction
      const [signedTx] = await signAllTransactions([transaction]);

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      });

      console.log('Transaction sent with signature:', signature);

      // Wait for confirmation
      const confirmed = await confirmTransaction(signature);

      const result: SwapResult = {
        signature,
        status: confirmed ? 'success' : 'error',
        error: confirmed ? undefined : 'Transaction failed to confirm'
      };

      setSwapResult(result);

      if (!confirmed) {
        throw new Error('Transaction failed to confirm');
      }

      return result;

    } catch (err) {
      console.error('Swap error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      
      const failedResult: SwapResult = {
        signature: '',
        status: 'error',
        error: errorMessage
      };
      
      setSwapResult(failedResult);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeSwap,
    loading,
    error,
    swapResult,
  };
};