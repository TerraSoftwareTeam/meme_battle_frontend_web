import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoundWinnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName?: string;
}

export function RoundWinnerDialog({ isOpen, onClose, winnerName }: RoundWinnerDialogProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow transition to trigger from 0
      setProgress(0);
      const raf = requestAnimationFrame(() => {
        setProgress(100);
      });
      
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
      };
    } else {
      setProgress(0);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      >
        {/* Simple CSS Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: -50, 
                x: Math.random() * window.innerWidth, 
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: window.innerHeight + 50, 
                x: Math.random() * window.innerWidth,
                rotate: 360,
                opacity: 0
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                ease: "linear",
                repeat: Infinity
              }}
              className="absolute w-3 h-3"
              style={{
                backgroundColor: ['#FFC700', '#FF0000', '#2E96FF', '#8FD14F', '#9D50EE'][Math.floor(Math.random() * 5)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px'
              }}
            />
          ))}
        </div>

        <motion.div 
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="relative w-full max-w-md bg-surface border-4 border-primary rounded-[32px] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(88,204,2,0.4)] text-center overflow-hidden"
        >
          <h2 className="text-4xl font-unbounded text-white mb-2 truncate max-w-full">
            {winnerName ? winnerName.toUpperCase() : 'ПОБЕДИТЕЛЬ!'}
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            {winnerName ? 'Забирает этот раунд!' : 'Раунд завершен! Самый смешной ответ выбран.'}
          </p>

          <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-5xl mb-6">
            🏆
          </div>

          <div className="w-full bg-elevated h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-primary ease-linear"
              style={{ 
                width: `${progress}%`,
                transition: isOpen ? 'width 3s linear' : 'none'
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
