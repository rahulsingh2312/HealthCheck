import React, { useState } from 'react';
import { useBulkTokenSwap } from "./useBulkTokenSwap";
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';

interface BulkTokenSwapButtonProps {
  selectedEmojis: Array<{ id: string; emoji: string }>;
  isDarkMode?: boolean;
  onSwapSuccess?: () => void;
  totalSolAmount?: number;
}

const BulkTokenSwapButton: React.FC<BulkTokenSwapButtonProps> = ({
  selectedEmojis,
  isDarkMode = false,
  onSwapSuccess,
  totalSolAmount,
}) => {
  const { executeBulkSwap, loading, error } = useBulkTokenSwap();
  const { select, wallets, connecting, connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<Array<{ id: string; emoji: string; amount: number }>>([]);

  const handleConnect = async () => {
    const phantomWallet = wallets.find(wallet =>
      wallet.adapter.name.toLowerCase().includes('phantom')
    );
    
    if (phantomWallet) {
      select(phantomWallet.adapter.name);
    } else if (wallets.length > 0) {
      select(wallets[0].adapter.name);
    }
  };

  const handleBulkBuy = async () => {
    if (!connected) {
      handleConnect();
      return;
    }

    if (selectedEmojis.length === 0) return;

    const amountPerEmoji = totalSolAmount ? totalSolAmount / selectedEmojis.length : 0;
    const bulkBuyTokens = selectedEmojis.map(emoji => ({
      id: emoji.id,
      emoji: emoji.emoji,
      amount: amountPerEmoji,
    }));

    setTokens(bulkBuyTokens);
    await handleBulkSwap(bulkBuyTokens);
  };

  const handleBulkSwap = async (tokensToSwap: Array<{ id: string; emoji: string; amount: number }>) => {
    if (tokensToSwap.length === 0) {
      alert("No tokens selected for swapping.");
      return;
    }

    try {
      await executeBulkSwap(tokensToSwap);
      
      if (onSwapSuccess) {
        onSwapSuccess();
      }
      
      alert('Emojis bought successfully!');
    } catch (err) {
      console.error("Bulk swap failed:", err);
      if (!connected) {
        alert('Please connect your wallet to buy tokens.');
      } else {
        alert('Transaction failed. Please try again.');
      }
    }
  };

  const getButtonText = () => {
    if (connecting) return 'Connecting Wallet...';
    if (loading) return 'Buying Tokens...';
    if (!connected) return 'Connect Wallet to Buy';
    return 'Buy These Emojis Now';
  };

  return (
    <button
      onClick={handleBulkBuy}
      disabled={loading || connecting}
      className={`
        w-full 
        ${isDarkMode ? 'text-white' : 'text-white border'}
        ${loading || connecting ? 'bg-gray-500' : 'bg-custom-green hover:bg-green-700'}
        py-3 
        rounded-lg 
        font-medium 
        transition-colors 
        flex 
        items-center 
        justify-center 
        gap-2
        ${(loading || connecting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}
      `}
    >
      {(loading || connecting) && <Loader2 className="h-4 w-4 animate-spin" />}
      {getButtonText()}
    </button>
  );
};

export default BulkTokenSwapButton;