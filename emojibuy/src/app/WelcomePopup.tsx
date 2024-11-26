import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Rocket, MousePointer2, ShoppingCart } from 'lucide-react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            setButtonEnabled(true);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="space-y-6 mb-10">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-6 text-center"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-4xl"
                  >
                    🚀
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-2xl flex justify-center items-center font-bold">Welcome to EmojiBuy ✨</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div>
                <MousePointer2 className="text-blue-500" size={20} />
              </div>
              <p>Tap to select tokens 👆</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <ShoppingCart className="text-green-500" size={20} />
              <p>Buy multiple at once 🎯</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <Rocket className="text-purple-500" size={20} />
              <p>Double tap for details 🔍</p>
            </div>
          </div>

          <div 
            onClick={buttonEnabled ? onClose : undefined}
            className={`w-full flex max-w-[90%] mx-auto justify-center items-center cursor-pointer 
              ${buttonEnabled 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              font-bold py-2 mb-10 rounded-lg relative`}
          >
            {buttonEnabled ? "Let's go! 🎮" : `Starting in ${countdown}`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;