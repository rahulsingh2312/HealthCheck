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
      <div className="space-y-6">
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

                <h2 className="text-2xl font-bold">Welcome to EmojiBuy ✨</h2>

                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-center gap-2 text-sm"
                  
                  >
                    <div
                     
                    >
                      <MousePointer2 className="text-blue-500" size={20} />
                    </div>
                    <p>Tap to select tokens 👆</p>
                  </div>

                  <div 
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <ShoppingCart className="text-green-500" size={20} />
                    <p>Buy multiple at once 🎯</p>
                  </div>

                  <div 
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <Rocket className="text-purple-500" size={20} />
                    <p>Double tap for details 🔍</p>
                  </div>
                </div>

                <div

                  onClick={handleClose}
                  className="w-full flex justify-center items-center cursor-pointer bg-green-500 
                    font-bold text-white py-2 rounded-lg 
                    "
                >
                  Let's go! 🎮
                </div>
           </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;