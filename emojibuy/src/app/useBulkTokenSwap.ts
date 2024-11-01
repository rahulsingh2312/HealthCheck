import React, { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { useWallet } from '@solana/wallet-adapter-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=215399cd-1d50-4bdf-8637-021503ae6ef3');
const jupiterQuoteApi = createJupiterApiClient();

interface TokenSwapInfo {
  id: string;
  amount: number;
  emoji?: string;
}

export const useBulkTokenSwap = () => {
  const { publicKey, signAllTransactions, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSwapQuotes = async (tokens: TokenSwapInfo[]) => {
    try {
        console.log('tokens:', tokens);
      const quotes: QuoteResponse[] = [];

      for (const token of tokens) {
        // Validate token address
        if (!PublicKey.isOnCurve(token.id)) {
          throw new Error(`Invalid token address: ${token.id}`);
        }

        // Convert SOL to lamports (1 SOL = 1 billion lamports)
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

  const executeBulkSwap = async (tokens: TokenSwapInfo[]) => {
    if (!publicKey || !signAllTransactions || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Get swap quotes for all tokens
      const quotes = await getSwapQuotes(tokens);

      // Prepare swap transactions
      const swapTransactions: VersionedTransaction[] = [];

      for (const quote of quotes) {
        // Get swap transaction for each quote
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
        swapTransactions.push(transaction);
      }

      // Sign and send all transactions
      const signedTxs = await signAllTransactions(swapTransactions);
      
      // You might want to send transactions sequentially or in parallel
      // This is a simple sequential sending approach
    //   for (const tx of signedTxs) {
    //     await sendTransaction(tx);
    //   }

      console.log('Bulk swap successful');
      return signedTxs;
    } catch (err) {
      console.error('Bulk swap error:', err);
      setError(err instanceof Error ? err.message : 'Bulk swap failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeBulkSwap,
    loading,
    error,
  };
};