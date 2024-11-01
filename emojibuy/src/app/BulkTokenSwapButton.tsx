import React, { useState } from 'react';
import { useBulkTokenSwap } from "./useBulkTokenSwap";

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
  const [tokens, setTokens] = useState<Array<{ id: string; emoji: string; amount: number }>>([]);

  const handleBulkBuy = () => {
    if (selectedEmojis.length === 0) return;

    console.log('selectedEmojis:', selectedEmojis);
    console.log('totalSolAmount:', totalSolAmount);
    
    const amountPerEmoji = totalSolAmount ? totalSolAmount / selectedEmojis.length : 0;
    const bulkBuyTokens = selectedEmojis.map(emoji => ({
      id: emoji.id,
      emoji: emoji.emoji,
      amount: amountPerEmoji,
    }));

    setTokens(bulkBuyTokens); 
    console.log('Bulk Buying:', bulkBuyTokens);
    
    // Call handleBulkSwap directly with the new tokens array
    handleBulkSwap(bulkBuyTokens);
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

      alert('Bulk swap successful!');
    } catch (err) {
      console.error("Bulk swap failed:", err);
      alert('Bulk swap failed');
    }
  };

  return (
    <button
      onClick={handleBulkBuy}
      disabled={loading}
      className={`w-full ${
        isDarkMode ? 'text-white' : 'text-white border'
      } bg-custom-green hover:bg-green-700 py-3 rounded-lg font-medium transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
      }`}
    >
      {loading ? 'Buying Tokens...' : 'Buy This Emojis Now'}
    </button>
  );
};

export default BulkTokenSwapButton;
