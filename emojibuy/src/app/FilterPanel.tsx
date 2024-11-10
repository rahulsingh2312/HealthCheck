import React from 'react';
import { 
  SlidersHorizontal, 
  ChevronDown,
  Star,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Percent
} from 'lucide-react';
import { on } from 'events';

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
  // const [sortBy, setSortBy] = React.useState('marketCap');
  // const [showTop10Only, setShowTop10Only] = React.useState(false);
  // const [isDarkMode, setIsDarkMode] = React.useState(true);
  // const [showFilters, setShowFilters] = React.useState(true);

  const filterOptions = {
    sortOptions: [
      { value: 'marketCap', label: 'Market Cap', icon: DollarSign },
      { value: 'price', label: 'Price', icon: TrendingUp },
      { value: 'change24h', label: '24h Change', icon: Percent }
    ]
  };

  const baseCardClass = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const baseTextClass = isDarkMode
    ? 'text-gray-100'
    : 'text-gray-800';

  return (
    <div className="relative">
     

        <div className={`p-4 w-72 absolute z-[100] right-0 mt-2 rounded-xl border ${baseCardClass} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-500" />
              <h3 className={`font-medium ${baseTextClass}`}>Filters</h3>
            </div>
            <button 
              onClick={() => onClose()}
              className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Sort Options */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${baseTextClass}`}>Sort By</label>
              <div className="grid grid-cols-1 gap-2">
                {filterOptions.sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors
                      ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      } ${sortBy === option.value ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                  >
                    <option.icon className={`w-4 h-4 ${sortBy === option.value ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${baseTextClass}`}>{option.label}</span>
                    {sortBy === option.value && (
                      <Check className="w-4 h-4 text-blue-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 10 Toggle */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${baseTextClass}`}>Display</label>
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

            {/* Dark Mode Toggle */}
            {/* <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
              >
                <span className={`text-sm ${baseTextClass}`}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
                <div className={`w-9 h-5 flex items-center rounded-full p-1
                  ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transform transition-transform
                    ${isDarkMode ? 'translate-x-4' : ''}`}>
                  </div>
                </div>
              </button>
            </div> */}
          </div>
        </div>
   
    </div>
  );
}

export default FilterPanel;