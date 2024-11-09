import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ChevronDown, ChevronUp, Twitter, Globe, Wallet } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  mintTo,
  createAssociatedTokenAccountIdempotent,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  createUpdateFieldInstruction,
  getMintLen,
  ExtensionType,
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import createTokenAndMint from './CreateTokenAndMint';
import { metadata } from './layout';
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
  const { publicKey, signAllTransactions ,signTransaction } = useWallet();
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
        setEmojisPerLine(9);
        setPickerWidth('350px');
      } else if (width >= 410) { // xs breakpoint
        setEmojisPerLine(9);
        setPickerWidth('350px');
      }
      else if (width >= 385) { // xs breakpoint
        setEmojisPerLine(7);
        setPickerWidth('300px');
      } else {
        setEmojisPerLine(7);
        setPickerWidth('270px');
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    setSelectedEmoji(emoji.native);
  };

  const handleCreateToken = async () => {
    if (publicKey && signTransaction && selectedEmoji && initialPrice) {
      const tokenMetadata = {
        name: name,
        symbol: selectedEmoji,
        uri: `https://emoji.beeimg.com/${selectedEmoji}`,
        socials: {
          twitter,
          website
        }
      };
  
      try {
        const result = await createTokenAndMint(tokenMetadata, { 
          publicKey, 
          signTransaction 
        });
        console.log('Token created successfully:', result);
        setShowCreateModal(false);
      } catch (error) {
        console.error('Failed to create token:', error);
        alert('Failed to create token. Please check console for details.');
      }
    } else {
      alert("Please fill all the fields and connect wallet");
    }
  };

 
  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md max-w-xl md:max-h-[85%] max-h-[80%] flex flex-col">
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