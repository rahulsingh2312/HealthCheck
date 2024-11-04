import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Twitter, Globe } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface CreateEmojiProps {
  showCreateModal: boolean;
  setShowCreateModal: (value: boolean) => void;
  isDarkMode: boolean;
}

const CreateEmoji: React.FC<CreateEmojiProps> = ({
  showCreateModal,
  setShowCreateModal,
  isDarkMode
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [name, setName] = useState('');
  const [showSocials, setShowSocials] = useState(false);
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [emojisPerLine, setEmojisPerLine] = useState(9);
  const [pickerWidth, setPickerWidth] = useState('350px');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768) { // md breakpoint
        setEmojisPerLine(9);
        setPickerWidth('350px');
      } else if (width >= 640) { // sm breakpoint
        setEmojisPerLine(7);
        setPickerWidth('280px');
      } else if (width >= 480) { // xs breakpoint
        setEmojisPerLine(7);
        setPickerWidth('260px');
      } else {
        setEmojisPerLine(7);
        setPickerWidth('260px');
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    setSelectedEmoji(emoji.native);
  };

  const handleCreateToken = () => {
    if (selectedEmoji && initialPrice) {
      console.log('Creating token with:', {
        emoji: selectedEmoji,
        price: initialPrice,
        name,
        socials: {
          twitter,
          website
        }
      });
      setShowCreateModal(false);
    }
  };

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md max-w-xl md:max-h-[85%] max-h-[75%] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Emoji</DialogTitle>
        </DialogHeader>
        <div className="md:p-6 overflow-y-auto">
          <div className="mb-4 flex justify-center">
            <div className="md:w-full lg:w-full flex justify-center">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={isDarkMode ? 'dark' : 'light'}
                perLine={emojisPerLine}
                style={{ width: pickerWidth }}
                previewPosition="none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2">Ticker / Symbol</div>
              <input
                type="text"
                value={selectedEmoji}
                placeholder="Selected emoji will appear here..."
                readOnly
                className={`w-full ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                } rounded-lg px-4 py-2`}
              />
            </div>

            <div>
              <div className="mb-2">Name</div>
              <input
                type="text"
                value={name}
                placeholder="Can be same as Ticker..."
                onChange={(e) => setName(e.target.value)}
                className={`w-full ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                } rounded-lg px-4 py-2`}
              />
            </div>

            <div>
              <div className="mb-2">How much SOL to allocate to the pool</div>
              <input
                type="number"
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
                placeholder="SOL..."
                className={`w-full ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                } rounded-lg px-4 py-2`}
              />
            </div>

            <div>
              <button
                onClick={() => setShowSocials(!showSocials)}
                className={`w-full flex items-center text-sm justify-between py-2 rounded-lg ${
                  isDarkMode ? ' text-white' : ' text-black'
                }`}
              >
                <span>Social Links (Optional)</span>
                {showSocials ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showSocials && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Twitter size={20} className="text-gray-500" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="Twitter handle (optional)"
                      className={`w-full ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                      } rounded-lg px-4 py-2`}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe size={20} className="text-gray-500" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Website URL (optional)"
                      className={`w-full ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                      } rounded-lg px-4 py-2`}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateToken}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Create Token
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmoji;