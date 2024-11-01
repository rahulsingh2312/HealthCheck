import React, { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { useWallet } from '@solana/wallet-adapter-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=215399cd-1d50-4bdf-8637-021503ae6ef3');
const jupiterQuoteApi = createJupiterApiClient();

export const useSingleTokenSwap = () => {
  const { publicKey, signAllTransactions, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSwapQuote = async (tokenAddress: string, amountInSol: number) => {
    try {
      if (!PublicKey.isOnCurve(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      // Convert SOL to lamports (1 SOL = 1 billion lamports)
      const amountInLamports = Math.floor(amountInSol * 1000000000);

      const quoteParams = {
        inputMint: SOL_MINT,
        outputMint: tokenAddress,
        amount: amountInLamports,
      };

      const quote = await jupiterQuoteApi.quoteGet(quoteParams);
      console.log(quote, 'Quote');
      
      // Ensure quote is not null and has necessary data
      if (!quote || !quote) {
        throw new Error('Failed to get valid quote data');
      }

      return quote;
    } catch (err) {
      console.error('Quote fetch error:', err);
      throw new Error('Failed to get swap quote');
    }
  };

  const executeSwap = async (tokenAddress: string, amountInSol: number) => {
    if (!publicKey || !signAllTransactions || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Get swap quote
      const quote = await getSwapQuote(tokenAddress, amountInSol);
      console.log(quote, 'Quote');

      // Get swap transaction
      const swapResponse = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        },
      });

      // Ensure swapResponse has the necessary transaction data
      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error('Failed to retrieve swap transaction data');
      }

      // Deserialize and send transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      console.log(swapTransactionBuf, 'Swap Transaction Buffer');
      console.log(swapResponse, 'Swap Response');

      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      console.log(transaction, 'Deserialized Transaction');

      // Sign and send
      const signedTx = await signAllTransactions([transaction]);
      console.log('Swap successful:', signedTx);

      return signedTx;
    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeSwap,
    loading,
    error,
  };
};
