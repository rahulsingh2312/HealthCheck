import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Rocket, MousePointer2, ShoppingCart } from 'lucide-react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose, isDarkMode }) => {
  // Ensure clean close with a proper handler
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-6 text-center"
            >
              <div className="space-y-6">
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

                <h2 className="text-2xl font-bold">Welcome to EmojiBuy ✨</h2>

                <div className="space-y-4">
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <MousePointer2 className="text-blue-500" size={20} />
                    </motion.div>
                    <p>Tap to select tokens 👆</p>
                  </motion.div>

                  <motion.div 
                    className="flex items-center justify-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ShoppingCart className="text-green-500" size={20} />
                    <p>Buy multiple at once 🎯</p>
                  </motion.div>

                  <motion.div 
                    className="flex items-center justify-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Rocket className="text-purple-500" size={20} />
                    <p>Double tap for details 🔍</p>
                  </motion.div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full bg-green-500 
                    font-bold text-white py-2 rounded-lg 
                    "
                >
                  Let's go! 🎮
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;