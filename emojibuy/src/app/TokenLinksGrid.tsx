import React from 'react';
import { ExternalLink, Share2, Squirrel } from 'lucide-react';

interface Token {
  url?: string;
  tokenAddress?: string;
  baseToken?: {
    address?: string;
  };
  info?: {
    socials?: { url?: string }[];
    websites?: { url?: string }[];
  };
}

interface TokenLinksGridProps {
  selectedToken: Token;
  isDarkMode: boolean;
}

const TokenLinksGrid: React.FC<TokenLinksGridProps> = ({ selectedToken, isDarkMode }) => {
  // Generate DEX link with proper template syntax
  const getDexUrl = () => {
    if (selectedToken?.url) {
      return selectedToken.url;
    }
    return `https://jup.ag/swap/SOL-${selectedToken?.tokenAddress || selectedToken?.baseToken?.address || ''}`;
  };

  // Safely get social URL with fallback
  const getSocialUrl = () => {
    const socialUrl = selectedToken?.info?.socials?.[0]?.url;
    return socialUrl || '#';
  };

  // Safely get website URL with fallback
  const getWebsiteUrl = () => {
    const websiteUrl = selectedToken?.info?.websites?.[0]?.url;
    if (!websiteUrl) return '#';
    return websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
  };

  const buttonClass = `flex text-xs items-center py-2 px-1 border-solid border justify-center rounded-lg ${
    isDarkMode ? 'border-white' : 'border-black'
  }`;

  return (
    <div className="grid grid-cols-3 justify-center items-center gap-4 mt-5">
      <button className={buttonClass}>
        <a 
          href={getDexUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center"
        >
          <ExternalLink className='mr-2' size={13} />
          DEX
        </a>
      </button>

      <button className={buttonClass}>
        <a 
          href={getSocialUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center"
        >
          <Share2 className='mr-2' size={13} />
          Social
        </a>
      </button>

      <button className={buttonClass}>
        <a 
          href={getWebsiteUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center"
        >
          <Squirrel className='mr-2' size={13} />
          Website
        </a>
      </button>
    </div>
  );
};

export default TokenLinksGrid;