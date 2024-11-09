import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ChevronDown, ChevronUp, Twitter, Globe, Wallet } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { useWallet } from '@solana/wallet-adapter-react';
import createTokenAndMint from './CreateTokenAndMint';
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
  const { publicKey, signTransaction } = useWallet();
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [name, setName] = useState('');
  const [showSocials, setShowSocials] = useState(false);
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [emojisPerLine, setEmojisPerLine] = useState(9);
  const [pickerWidth, setPickerWidth] = useState('350px');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStep, setTransactionStep] = useState('');
  const [disabledEmojis, setDisabledEmojis] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768) {
        setEmojisPerLine(9);
        setPickerWidth('350px');
      } else if (width >= 640) {
        setEmojisPerLine(9);
        setPickerWidth('350px');
      } else if (width >= 410) {
        setEmojisPerLine(9);
        setPickerWidth('350px');
      }
      else if (width >= 385) {
        setEmojisPerLine(7);
        setPickerWidth('300px');
      } else {
        setEmojisPerLine(7);
        setPickerWidth('270px');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchExistingEmojis = async () => {
      try {
        const db = getFirestore();
        const tokensCollection = collection(db, 'tokens');
        const tokensSnapshot = await getDocs(tokensCollection);
        const existingEmojis = tokensSnapshot.docs.map(doc => doc.data().emoji);
        setDisabledEmojis(existingEmojis);
      } catch (error) {
        console.error('Error fetching existing emojis:', error);
      }
    };

    fetchExistingEmojis();
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    if (!disabledEmojis.includes(emoji.native)) {
      setSelectedEmoji(emoji.native);
      setName(emoji.native);
    }else{

      alert("Emoji already exists , try aping it instead!");
    }
  };

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction || !selectedEmoji || !initialPrice) {
      alert("Please fill all the fields and connect wallet");
      return;
    }

    setIsLoading(true);
    try {
      setTransactionStep('Creating token mint...');
      
      // Create metadata URL with social links
      const metadata = {
        name: name,
        symbol: selectedEmoji,
        socials: {
          twitter: twitter || '',
          website: website || ''
        }
      };
      // Create token
      const result = await createTokenAndMint(
        metadata,
        {
          publicKey,
          signTransaction
        },
        Number(initialPrice)
      );

      // Save to Firestore
      const db = getFirestore();
      await addDoc(collection(db, 'tokens'), {
        tokenAddress: result.mint,
        emoji: selectedEmoji,
        name: name,
        creator: publicKey.toString(),
        createdAt: new Date().toISOString(),
        socials: {
          twitter: twitter ? `https://twitter.com/${twitter.replace('@', '')}` : '',
          website: website || ''
        },
        metadata: metadata
      });

      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create token:', error);
      alert('Failed to create token. Please check console for details.');
    } finally {
      setIsLoading(false);
      setTransactionStep('');
// to-do
      // uncomment this line to reload the site after creating token after dev is over do this
      // window.location.reload();
    }
  };

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className={`sm:max-w-md max-w-xl md:max-h-[90%] max-h-[90%] flex flex-col ${isLoading ? 'pointer-events-none' : ''}`}>
        {/* <div className={`relative ${isLoading ? 'blur-sm' : ''}`}> */}
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
                disabled={isLoading}
                className={`w-full ${
                  isLoading ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
                } text-white py-3 rounded-lg font-medium transition-colors`}
              >
                {isLoading ? 'Creating Token...' : 'Create Token'}
              </button>
            </div>
          </div>
        {/* </div> */}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <LoadingSpinner size={40} />
            <p className="mt-4 text-white">{transactionStep}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmoji;