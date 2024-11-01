'use client';
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, Sun, Moon, ShoppingCart, Share2, ExternalLink, Squirrel, Send, PawPrint, Menu, X, MousePointer2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { WalletMultiButton } from "@tiplink/wallet-adapter-react-ui";
import BulkTokenSwapButton from './BulkTokenSwapButton';
import '@solana/wallet-adapter-react-ui/styles.css';
const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + ' K';
  return num.toLocaleString();
};

import { WalletProvider } from '@solana/wallet-adapter-react';
import SingleToken from '../PurchaseFunctions/SingleToken';
import SingleTokenSwapButton from './SingleTokenSwapButton';
import BundledToken from '../PurchaseFunctions/BundledToken';
import { TipLinkWalletAdapter } from "@tiplink/wallet-adapter";

import { WalletModalProvider, TipLinkWalletAutoConnectV2 } from '@tiplink/wallet-adapter-react-ui';
import TokenDetailsTable from './TokenDetailsTable';
const wallets = [
  new TipLinkWalletAdapter({
    title: "Emoji Buy",
    clientId: "f7d3033a-a221-42e2-b8cb-0b73c1bc3c27",
    theme: "light",
    hideDraggableWidget: false
  }),
];
let bulkTokens:any ;
// import data from './demo.json';
import MarketInfo from './MarketInfo';  // Import MarketInfo component
import AmountInput from './Amount';
interface Token {
  id: string;
  emoji: string;
  marketCap: number;
  price: string;
  type: string;
  change24h: number;
  xPosition?: number;

}

interface CartItem extends Token {
  quantity: number;
}

// Function to generate consistent X position based on token ID
const generateXPosition = (id: string, index: number, totalTokens: number) => {
  console.log('id', id);
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const goldenRatio = 1.618033988749895;
  const basePosition = (index * goldenRatio * 100) % 100;
  const hashNoise = (hash % 20) - 10;
  return Math.max(10, Math.min(90, basePosition + hashNoise));
};

// Detailed Token Interface
interface TokenDetails {
  url: string | undefined;
  priceUsd: string;
  baseToken: any;
  priceChange: any;
  info: any;
  id: string;
  emoji: string;
  type: string;
  price: string;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
}
// Token Configuration
const TOKEN_CONFIG = [
  {
    id: "73wLBbQ3FnVx9GEEyTDaKEuVbau5KWP47aaYsPbsZuEc",
  },
  {
    id: "4QiXvvrov7HQYDQmLkYbDkFCPuCbzE41xnv5WVDzyQQi",
  },

  {
    id: "9vNYnBh3A1avzcnRTYW8Wp95JTQLS1GKA9gmF71isGbR",
  },

  {
    id: "BfUGEJn5RWwPkkFZFgy5H4WAKBDcYryPVxf4eCCC69Pt",
  },

  

  {
    id: "8a259MoBCF8DRwHqv4J5cog8mTbE2DDNTqB9BiMKz2at",
  },
  {
    id: "GdNhmuWQN4M22hWi4e2gEhg7787LcUVwud8buxCi1Yod",
  },

  {
    id: "FfSQ7ko15hisjVieH5tD4h76zAGCiy1qpvLPBGwMimD",
  },

  {
    id: "A3dz8GgCnnwdD4LZF2kq9wpF2Vi5SyLCE6wPiHscu24z",
  },
  
];

const EmojiRace = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<Token | null>(null);
  const [selectedEmojis, setSelectedEmojis] = useState<Token[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkBuyModal, setShowBulkBuyModal] = useState(false);
  const [totalSolAmount, setTotalSolAmount] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false); // New state for mobile nav
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [sortBy, setSortBy] = useState('marketCap');
  const [showTop10Only, setShowTop10Only] = useState(false);
  const [tokens, setTokens] = useState<TokenDetails[]>([]);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    topGainer: null,
    topGainerPercentage: 0,
    volume24h: 0
  });
  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTokenData = async () => {
    try {
      setIsLoading(true);
      const tokenIds = TOKEN_CONFIG.map(token => token.id).join(',');
      console.log('tokenIds', tokenIds);
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenIds}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }
  
      const data = await response.json();
      
      // Map to store unique tokens by ID and pass the entire response
      const uniqueTokens = new Map();
      console.log('data', data);
  
      // Initialize market stats variables
      let totalMcap = 0;
      let topGainer = null;
      let maxChange = -Infinity; // Set to -Infinity to capture the highest percentage change
      let totalVolume = 0;
  
      // Populate unique tokens and calculate market stats in a single pass
      data.pairs.forEach((pair:any) => {
        const {info, baseToken, marketCap = 0, volume = {}, priceChange = {} } = pair;
        const tokenAddress = baseToken?.address;
        
        if (tokenAddress && !uniqueTokens.has(tokenAddress)) {
          uniqueTokens.set(tokenAddress, pair);
          
          // Update market stats
          totalMcap += marketCap;
          totalVolume += volume.h24 || 0;
          
          if (priceChange.h24 > maxChange) {
            maxChange = priceChange.h24;
            topGainer = info?.imageUrl || baseToken.symbol;
          }
        }
      });
  
      // Update state with calculated stats
      setMarketStats({
        totalMarketCap: totalMcap,
        topGainer,
        topGainerPercentage: maxChange,
        volume24h: totalVolume,
      });
      
  
      setTokens(Array.from(uniqueTokens.values()));
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError('Failed to load token data');
      setIsLoading(false);
    }
  };
  
useEffect(() => {
  fetchTokenData();
}, []);
interface TokenPrices {
  [key: string]: { price: number };
}

const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});

useEffect(() => {
  async function fetchTokenPrices() {
    const tokenIds = selectedEmojis.map((emoji) => emoji.id).join(',');
    try {
      const response = await fetch(`https://api.jup.ag/price/v2?ids=${tokenIds}&vsToken=So11111111111111111111111111111111111111112`);
      const data = await response.json();
      setTokenPrices(data.data);
    } catch (error) {
      console.error("Error fetching token prices:", error);
    }
  }
  
  fetchTokenPrices();
}, [selectedEmojis]);

const sortTokens = (tokensToSort: TokenDetails[]) => {
  return [...tokensToSort].sort((a, b) => {
    switch (sortBy) {
      case 'marketCap':
        return (b.marketCap || 0) - (a.marketCap || 0);
      case 'price':
        return parseFloat(b.priceUsd?.replace('$', '') || '0') - 
               parseFloat(a.priceUsd?.replace('$', '') || '0');
      case 'change24h':
        return (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0);
      default:
        return 0;
    }
  });
};

const filteredData = sortTokens(
  tokens
    .filter(item => {
      const matchesSearch = item.baseToken.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.priceUsd.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    })
).slice(0, showTop10Only ? 10 : undefined);



const toggleEmojiSelection = (token: Token) => {
  setSelectedEmojis(prev => 
    prev.some(e => e.id === token.id)
      ? prev.filter(e => e.id !== token.id)
      : [...prev, token]
  );
};

  
  const handleTokenSelect = (token: TokenDetails) => {
    setSelectedToken(token);
    setShowBuyModal(true);
  };

  const filterOptions = {
    types: ['all', 'animal', 'people', 'object', 'nature', 'food'],
    sortOptions: [
      { value: 'marketCap', label: 'Market Cap' },
      { value: 'change24h', label: '24h Change' },
      { value: 'price', label: 'Price' }
    ]
  };
 const amountPerEmoji = selectedEmojis.length > 0 ? totalSolAmount / selectedEmojis.length : 0;
 

const MobileNav = () => (
  <div
    className={`fixed inset-0 z-50 ${
      isDarkMode ? 'bg-gray-900/70' : 'bg-white/70'
    } backdrop-filter backdrop-blur-md text-gray-100`}
  >
    <div className="flex justify-between items-center p-4 border-b">
      <h1 className={`${
      isDarkMode ? 'bg-gray-900/70' : 'bg-white/70 text-black'
    } text-xl font-bold`}>Emoji Buy</h1>
      <button onClick={() => setShowMobileNav(false)}>
        <X size={24} className="text-gray-400" />
      </button>
    </div>
    <div className="p-4 mt-4 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search emojis..."
          className="w-full rounded-lg px-4 py-2 pl-9 bg-gray-800 text-white"
        />
        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
      </div>

      <div className="flex gap-x-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex py-3  items-center gap-3 justify-center p-2 rounded-lg w-full bg-gray-800 text-white"
        >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-3 p-2 rounded-lg w-full bg-gray-800 text-white"
        >
          <Filter size={18} />
        </button>


        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-3 p-2 rounded-lg w-full bg-custom-green text-white"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  </div>
);


  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);



 // Enhanced FilterPanel component
 const FilterPanel = () => (
  <div className={`fixed top-20 right-4 z-[100] px-4 py-4 rounded-lg shadow-lg ${
    isDarkMode ? 'bg-gray-800' : 'bg-white'
  }`}>
    <div className='justify-between flex items-center mb-4'>
      <h3 className="font-medium">Filters</h3>
      <button 
        onClick={() => setShowFilters(false)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
      >
        <X size={20} className="text-gray-400" />
      </button>
    </div>
    
    <div className="space-y-4">
      {/* <div>
        <label className="block text-sm mb-2">Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={`w-full rounded-lg px-3 py-2 ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
          }`}
        >
          {filterOptions.types.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div> */}

      <div>
        {/* <label className="block text-sm mb-2">Sort By</label> */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-full rounded-lg px-3 py-2 ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
          }`}
        >
          {filterOptions.sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="top10"
          checked={showTop10Only}
          onChange={(e) => setShowTop10Only(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="top10" className="text-sm">Show Top 10 Only</label>
      </div>

     
    </div>
  </div>
);

  return (
    <WalletProvider wallets={wallets} autoConnect>
    {typeof window !== 'undefined' && (
      <TipLinkWalletAutoConnectV2 isReady query={new URLSearchParams(window.location.search)}>
        <WalletModalProvider>

    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
       <div className='flex items-center justify-between p-5'>
          
       <h1 className={`text-2xl ${
      isDarkMode ? 'bg-gray-900/70' : 'bg-white/70'
    } font-bold`}>Emoji Buy</h1>

<WalletMultiButton
              style={{
                width: "110px",
                fontSize: "9px",
                height: "40px",
                background: "#A9F605",
                color: "black",
                borderRadius: "180px",
              }}
            /> 
       {/* Mobile Controls */}
           <button onClick={() => setShowMobileNav(true)} className="sm:hidden p-1.5 rounded-lg">
          <Menu size={24} />
        </button>
      </div>
      {!showMobileNav && !isSelectionMode &&  <div>  <button
                onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                } }className={` bottom-24 text-xs fixed md:hidden right-4 z-50 px-3 py-2 rounded-full ${
                  !isSelectionMode 
                    ? 'bg-custom-green text-white' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } flex items-center gap-1`}
              >
                <MousePointer2 size={18} />
                {isSelectionMode ? 'Exit Selection' : 'Select Emojis'}
              </button> 
              </div> }
              {!showMobileNav && isSelectionMode &&  <div>  <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={` bottom-36 text-xs fixed md:hidden right-4 z-50 px-3 py-2 rounded-full ${
                  !isSelectionMode 
                    ? 'bg-custom-green text-white' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } flex items-center gap-1`}
              >
                <MousePointer2 size={18} />
                {isSelectionMode ? 'Exit Selection' : 'Select Emojis'}
              </button> 
              </div> }
      {/* Render Mobile Navigation if active */}
      {showMobileNav && <MobileNav />}
   
      {/* Header */}
      <div className={`${
      isDarkMode ? 'bg-gray-900/70' : 'bg-white/70'
    } hidden fixed top-0 left-0 right-0 z-40 p-4 backdrop-blur-md bg-opacity-80 
        border-b border-gray-700 md:flex justify-between items-center`}>
        <h1 className="text-2xl font-bold">Emoji Buy</h1>

        <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`fixed bottom-4 top-24 right-4 z-50 px-4 py-6 rounded-full ${
                  !isSelectionMode 
                    ? 'bg-custom-green text-white' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } flex items-center gap-2`}
              >
                <MousePointer2 size={18} />
                {isSelectionMode ? 'Exit Selection' : 'Select Emojis'}
              </button>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
    
        <WalletMultiButton
              style={{
                background: "#A9F605",
                color: "black",
                borderRadius: "180px",
              }}
            /> 
            
          <div className="relative">
       
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={`rounded-lg px-3 py-1.5 pl-9 w-40 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            />
            <Search className="absolute left-2 top-2 text-gray-400" size={16} />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-lg ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>


          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-custom-green text-white hover:bg-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>
{showFilters && <FilterPanel />}
<div className="container mx-auto px-4 pt-10">
          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredData.map((token , index) => (
                <div
                  key={token.id || index}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleEmojiSelection({
                        id: token.baseToken?.address || '',
                        emoji: token?.info.imageUrl || '',
                        marketCap: token.marketCap || 0,
                        price: token.priceUsd || '',
                        type:  'unknown',
                        change24h: token.priceChange?.h24 || 0,
                        xPosition: generateXPosition(token.baseToken?.address || '', 0, tokens.length)
                      });
                      setSelectedToken(token);
                    } else {
                      setSelectedToken(token);
                      setShowBuyModal(true);
                    }
                  }}
                  className={`cursor-pointer p-4 rounded-lg ${
                    isSelectionMode && selectedEmojis.some(e => e.id === token.baseToken?.address)
                      ? 'bg-custom-green/40' // Custom green background for selected emojis in selection mode
                      : isDarkMode
                      ? 'hover:bg-gray-800' // Dark mode hover effect
                      : 'hover:bg-gray-100' // Light mode hover effect
                  }`}
                  
                >
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2"><img className=' ' src={token?.info?.imageUrl}></img></span>
                    <span className="text-xs text-gray-500">
                       ${formatNumber(token.marketCap)}
                    </span>
                    <span className={`text-xs ${token.priceChange.h24
 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {console.log('token', token)}
                      {token.priceChange.h24.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
      <DialogContent className="max-w-xl md:max-h-[85%] max-h-[75%] flex flex-col">
        <DialogHeader>
          <DialogTitle>Token Details</DialogTitle>
      
        </DialogHeader>
        <div className="overflow-y-auto p-6 flex-grow">
          {selectedToken && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <span className="text-6xl mb-4 justify-center items-center flex">
                  
                   <img 
                     className="w-24 h-24 object-cover" 
                     src={selectedToken?.info?.imageUrl} 
                     alt="unknown" 
                   />
                </span>
                <p className="text-xl font-medium mb-2">{selectedToken.price}</p>
              </div>

              <TokenDetailsTable 
                selectedToken={selectedToken} 
                isDarkMode={isDarkMode} 
              />

              <div className='mt-6'>
                <AmountInput  
                  isdarkmode={isDarkMode}   
                  value={buyQuantity}   
                  onChange={(value) => setBuyQuantity(value)} 
                />
              </div>
              <SingleTokenSwapButton 
  tokenAddress={selectedToken?.baseToken.address}
  solAmount={buyQuantity}  // Amount in SOL 
  isdarkmode={isDarkMode}
/>
              {/* <button
                 onClick={() => SingleToken({ tokenaddress: selectedToken?.baseToken.address , amount: buyQuantity })}

                className={`w-full ${
                  isDarkMode ? 'text-white' : 'text-white border'
                } bg-custom-green hover:bg-green-700 py-3 rounded-lg  font-medium transition-colors`}
              >
                Buy Now
              </button> */}

              <div className="grid grid-cols-3 justify-center items-center gap-4 mt-5">
                <button 
                  className={`flex text-xs items-center py-2 px-1 border-solid border justify-center rounded-lg ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}
                >
                  <a href={selectedToken.url} className="flex items-center">
                    <ExternalLink className='mr-2' size={13} />
                    DEX
                  </a>
                </button>

                <button 
                  className={`flex text-xs items-center py-2 px-1 border-solid border justify-center rounded-lg ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}
                >
                  <a href={selectedToken?.info?.socials[0]?.url} className="flex items-center">
                    <Share2 className='mr-2' size={13} />
                    Social
                  </a>
                </button>

                <button 
                  className={`flex text-xs items-center py-2 px-1 border-solid border justify-center rounded-lg ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}
                >
                  <a href={selectedToken?.info?.websites[0]?.url} className="flex items-center">
                    <Squirrel className='mr-2' size={13} />
                    Website
                  </a>
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog> 
              {/* Bulk Buy Modal */}
              <Dialog open={showBulkBuyModal} onOpenChange={setShowBulkBuyModal}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Bulk Buy Emojis</DialogTitle>
                  </DialogHeader>
                  <div className="p-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        Total SOL Amount
                      </label>
                      <input
                        type="number"
                        value={totalSolAmount}
                        onChange={(e) => setTotalSolAmount(Number(e.target.value))}
                        className={`w-full  px-3 py-3 rounded-lg ${isDarkMode? "bg-gray-900 text-white" : "bg-gray-100 text-black" }`}
                        min="0.1"
                        step="0.1"
                      />
                  <p className="mt-2 text-sm text-gray-400">
  {amountPerEmoji.toFixed(amountPerEmoji >= 1 ? 2 : Math.min((amountPerEmoji.toString().split(".")[1]?.length || 0), 8))} SOL per emoji
</p>

                    </div>
                    <div className="grid grid-cols-4  gap-2 mb-6">
            {selectedEmojis.map((emoji, key) => {
              const tokenPriceInSOL = tokenPrices[emoji.id]?.price || 0;
              console.log('tokenPriceInSOL', tokenPriceInSOL);
              const tokensPerEmoji = tokenPriceInSOL > 0 ? amountPerEmoji / tokenPriceInSOL : 0;

              return (
                <div key={emoji.id || key} className={`rounded-lg text-center p-2  ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
                  <span className="text-2xl flex justify-center items-center">
                    <img className="w-10" src={emoji.emoji} alt="" />
                  </span>
                  <p className="mt-2 text-xs text-gray-400">
                    {tokensPerEmoji.toFixed(2)} 
                    &nbsp; tokens
                  </p>
                </div>
              );
            })}
          </div>
                    {/* <div className="grid grid-cols-4 gap-2 mb-6">
                      {selectedEmojis.map((emoji , key) => (
                        <div key={emoji.id || key} className={` rounded-lg  text-center p-2 ${isDarkMode? "bg-gray-900 text-white" : "bg-gray-100 text-black" }`}>
                          <span className="text-2xl flex justify-center items-center"><img className='w-10'  src={emoji.emoji} /></span>
                        </div>
                      ))}
                    </div> */}

                    {/* <button
                      onClick={handleBulkBuy}
                      className="w-full bg-custom-green hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                    >
                      Buy {selectedEmojis.length} Emojis
                    </button> */}

                    <BulkTokenSwapButton 
    onSwapSuccess={() => {
      setShowBulkBuyModal(false);
      setSelectedEmojis([]);
      setIsSelectionMode(false);
    }}
  selectedEmojis={selectedEmojis} 
  totalSolAmount={totalSolAmount}
                    isDarkMode={true} 
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {selectedEmojis.length > 0  && isSelectionMode && (
                <button
                  onClick={() => setShowBulkBuyModal(true)}
                  className="fixed bottom-20 right-4 z-50 px-6 py-3 bg-custom-green text-white rounded-full shadow-lg flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Buy {selectedEmojis.length} Selected
                </button>
              )}

      {/* Create Token Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Token</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <input
              type="text"
              placeholder="Select emoji..."
              className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4"
            />
            <input
              type="number"
              placeholder="Initial price..."
              className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4"
            />
            <button className="w-full bg-custom-green hover:bg-purple-700 py-3 rounded-lg font-medium transition-colors">
              Create Token
            </button>
          </div>
        </DialogContent>

      </Dialog>
      <MarketInfo marketCap={formatNumber(marketStats.totalMarketCap)} topgain={marketStats.topGainer} gainerPercentage={marketStats.topGainerPercentage.toFixed(2)} />

    </div>
    </WalletModalProvider>
      </TipLinkWalletAutoConnectV2>
    )}
  </WalletProvider>

  );
};

export default EmojiRace;