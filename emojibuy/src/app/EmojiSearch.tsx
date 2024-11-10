import React, { useState } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiSearchProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isDarkMode: boolean;
}

const EmojiSearch: React.FC<EmojiSearchProps> = ({ searchTerm, setSearchTerm, isDarkMode }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const onEmojiClick = (emojiObject: { emoji: string; }) => {
    setSearchTerm(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowEmojiPicker(true)}
          placeholder="Search emojis..."
          className={`w-full rounded-lg px-4 py-2 pl-9 ${
            isDarkMode 
              ? 'bg-gray-800 text-white placeholder-gray-400' 
              : 'bg-white text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-custom-green`}
        />
         <span className='font-bold absolute right-3 top-2 text-gray-400' onClick={() => setSearchTerm("")}>
          X
        </span>
        <Search 
          className="absolute left-3 top-3 text-gray-400" 
          size={16} 
        />
       
      </div>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2"
          >
            <div 
              className="fixed inset-0" 
              onClick={() => setShowEmojiPicker(false)}
            />
            <div className="relative">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                searchPlaceHolder="Filter emojis..."
                width={300}
                skinTonesDisabled
                autoFocusSearch
                previewConfig={{ showPreview: false }}
                height={400}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiSearch;