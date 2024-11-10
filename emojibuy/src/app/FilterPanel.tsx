import React from 'react';
import { ChevronDown, SlidersHorizontal, Star, Check, X } from 'lucide-react';

interface FilterPanelProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  showTop10Only: boolean;
  setShowTop10Only: (value: boolean) => void;
  isDarkMode: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  sortBy,
  setSortBy,
  showTop10Only,
  setShowTop10Only,
  isDarkMode,
  onClose
}) => {
  const filterOptions = {
    sortOptions: [
      { value: 'marketCap', label: 'Market Cap' },
      { value: 'price', label: 'Price' },
      { value: 'change24h', label: '24h Change' },
    ]
  };

  const baseCardClass = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const baseTextClass = isDarkMode
    ? 'text-gray-100'
    : 'text-gray-800';

  return (
    <div className={`p-4 w-60 absolute z-[100] right-3 mt-3 rounded-xl border ${baseCardClass} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-500" />
          <h3 className={`font-medium ${baseTextClass}`}>Filters</h3>
        </div>
        <button 
          onClick={onClose}
          className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full appearance-none rounded-lg px-4 py-2.5 pr-10 border transition-colors
              ${isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            {filterOptions.sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 
            ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTop10Only(!showTop10Only)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors
              ${isDarkMode 
                ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } ${showTop10Only ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${showTop10Only ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={`text-sm ${baseTextClass}`}>Show Top 10 Only</span>
            </div>
            {showTop10Only && (
              <Check className="w-4 h-4 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;