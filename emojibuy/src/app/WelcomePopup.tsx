import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Rocket, MousePointer2, ShoppingCart } from 'lucide-react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose, isDarkMode }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 text-center"
        >
          <div className="space-y-6">
            <div className="flex justify-center">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                🚀
              </motion.div>
            </div>
            
            <h2 className="text-2xl font-bold">Welcome to EmojiBuy ✨</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm">
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="text-4xl"
              >
                <MousePointer2 className="text-blue-500" size={20} />
                
              </motion.div>
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

            <button
              onClick={onClose}
              className="w-full bg-custom-green text-black py-2 rounded-lg font-medium hover:bg-green-400 transition-colors"
            >
              Let's go! 🎮
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;