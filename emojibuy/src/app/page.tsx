'use client';
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, Sun, Moon, ShoppingCart, Share2, ExternalLink, Send, PawPrint, Menu , X
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import data from './demo.json';

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
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const goldenRatio = 1.618033988749895;
  const basePosition = (index * goldenRatio * 100) % 100;
  const hashNoise = (hash % 20) - 10;
  return Math.max(10, Math.min(90, basePosition + hashNoise));
};

// Calculate Y position based on market cap ranking (inverted so higher market cap is at top)
const calculateYPosition = (marketCap: number, maxMarketCap: number) => {
  // Invert the position calculation so higher market cap is at top
  const basePosition = (1 - (marketCap / maxMarketCap)) * 60;
  return Math.max(20, Math.min(80, 20 + basePosition));
};

const EmojiRace = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedEmoji, setSelectedEmoji] = useState<Token | null>(null);
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

  // Enhanced filter options
  const filterOptions = {
    types: ['all', 'animal', 'people', 'object', 'nature', 'food'],
    sortOptions: [
      { value: 'marketCap', label: 'Market Cap' },
      { value: 'change24h', label: '24h Change' },
      { value: 'price', label: 'Price' }
    ]
  };





  //MOBILE NAV
// MOBILE NAV

const MobileNav = () => (
  <div
    className={`fixed inset-0 z-50 ${
      isDarkMode ? 'bg-gray-900/70' : 'bg-white/70'
    } backdrop-filter backdrop-blur-md text-gray-100`}
  >
    <div className="flex justify-between items-center p-4 border-b">
      <h1 className="text-xl font-bold">Emoji Buy</h1>
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
          className="flex items-center gap-3 justify-center p-2 rounded-lg w-full bg-gray-800 text-white"
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
          onClick={() => setShowCartModal(true)}
          className="flex items-center justify-center gap-3 p-2 rounded-lg w-full bg-gray-800 text-white"
        >
          <ShoppingCart size={18} />
          ({cart.length})
        </button>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-3 p-2 rounded-lg w-full bg-purple-600 text-white"
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

  const processedData = React.useMemo(() => {
    let sortedData = [...data.tokens];

    // Apply sorting
    switch (sortBy) {
      case 'marketCap':
        sortedData.sort((a, b) => b.marketCap - a.marketCap);
        break;
      case 'change24h':
        sortedData.sort((a, b) => b.change24h - a.change24h);
        break;
      case 'price':
        sortedData.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
    }

    const maxMarketCap = Math.max(...sortedData.map(t => t.marketCap));
    
    return sortedData.map((token, index) => ({
      ...token,
      xPos: generateXPosition(token.id, index, sortedData.length),
      yPos: calculateYPosition(token.marketCap, maxMarketCap)
    }));
  }, [sortBy]);

  const filteredData = processedData
    .filter(item => {
      const matchesSearch = item.emoji.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.price.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .slice(0, showTop10Only ? 10 : undefined);

  const addToCart = (token: Token, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === token.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === token.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...token, quantity }];
    });
    setShowBuyModal(false);
    setBuyQuantity(1);
  };

  const removeFromCart = (tokenId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== tokenId));
  };

  const updateCartQuantity = (tokenId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(tokenId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === tokenId ? { ...item, quantity } : item
      )
    );
  };

  // Filter Panel Component
  const FilterPanel = () => (
    <div className={`fixed top-20 right-4 z-[100] px-4   py-4 rounded-lg shadow-lg ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className='justify-between flex'>
      <h3 className="font-medium mb-3">Filters</h3>
      <X  onClick={() => setShowFilters(!showFilters)} size={24} className="text-gray-400 cursor-pointer" />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            {filterOptions.types.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
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
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
       <div className='flex justify-between p-5'>
          
       <h1 className="text-2xl font-bold">Emoji Buy</h1>
       {/* Mobile Controls */}
           <button onClick={() => setShowMobileNav(true)} className="sm:hidden p-1.5 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* Render Mobile Navigation if active */}
      {showMobileNav && <MobileNav />}

      {/* Header */}
      <div className="hidden fixed top-0 left-0 right-0 z-40 p-4 backdrop-blur-md bg-opacity-80 
        border-b border-gray-700 md:flex justify-between items-center">
        <h1 className="text-2xl font-bold">Emoji Buy</h1>

       

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
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
            onClick={() => setShowCartModal(true)}
            className={`p-1.5 rounded-lg relative ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            <ShoppingCart size={18} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && <FilterPanel />}

      {/* Emoji Canvas */}
      <div className="relative pt-16 h-screen overflow-hidden">
        {filteredData.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.xPos}%`,
              top: `${item.yPos}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => {
              setSelectedEmoji(item);
              setShowBuyModal(true);
            }}
            className="flex flex-col items-center cursor-pointer group"
          >
            <span className="text-4xl mb-1 transform transition-transform group-hover:scale-110">
              {item.emoji}
            </span>
            <span className={`text-xs font-medium ${
              item.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {item.change24h >= 0 ? '+' : ''}{item.change24h}%
            </span>
          </div>
        ))}
      </div>

      {/* Buy Token Modal */}
      <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Buy Token</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedEmoji && (
              <div className="text-center mb-6">
                <span className="text-6xl mb-4 block">{selectedEmoji.emoji}</span>
                <p className="text-xl font-medium mb-2">{selectedEmoji.price}</p>
                <p className={`text-sm ${
                  selectedEmoji.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {selectedEmoji.change24h >= 0 ? '+' : ''}{selectedEmoji.change24h}%
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setBuyQuantity(prev => Math.max(1, prev - 1))}
                className="bg-gray-700 px-5 hover:bg-gray-600 p-2 rounded-lg"
              >
                -
              </button>
              <input
                type="number"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center bg-gray-800 rounded-lg px-4 py-2"
              />
              <button 
                onClick={() => setBuyQuantity(prev => prev + 1)}
                className="bg-gray-700 px-5 hover:bg-gray-600 p-2 rounded-lg"
              >
                +
              </button>
            </div>
            <button 
              onClick={() => selectedEmoji && addToCart(selectedEmoji, buyQuantity)}
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium transition-colors"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => selectedEmoji && addToCart(selectedEmoji, buyQuantity)}
              className="w-full bg-green-600 hover:bg-green-700 mt-5 py-3 rounded-lg font-medium transition-colors"
            >
              Buy Now
            </button>
                
            <div className="grid grid-cols-4 justify-center items-center gap-4 mt-5">
              <button className="flex text-xs items-center border-white py-2 px-1 border-solid border justify-center rounded-lg">
                <ExternalLink className='mr-2' size={13} />
                DEX
              </button>
              <button className="flex text-xs items-center justify-center py-2 border-white border-solid border rounded-lg">
                <Share2 className='mr-2' size={13} />
                X
              </button>
              <button className="flex text-xs items-center justify-center py-2 border-white border-solid border rounded-lg">
                <Send className='mr-2' size={13} />
                tg
              </button>
              <button className="flex text-xs items-center justify-center py-2 border-white border-solid border rounded-lg">
                <PawPrint className='mr-2' size={13} />
                Sell
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Modal */}
      <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <span>{item.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-700 px-4 hover:bg-gray-600 p-1 rounded"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-700 px-4 hover:bg-gray-600 p-1 rounded"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium mt-6 transition-colors">
                  Checkout
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            <button className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium transition-colors">
              Create Token
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmojiRace;