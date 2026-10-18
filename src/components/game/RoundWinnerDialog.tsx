import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

interface RoundWinnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName?: string;
  roundNumber?: number;
}

export function RoundWinnerDialog({ isOpen, onClose, winnerName, roundNumber }: RoundWinnerDialogProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      const raf = requestAnimationFrame(() => {
        setProgress(100);
      });

      // Show for 3.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3500);

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Confetti Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: -30,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                rotate: 0,
                opacity: 1
              }}
              animate={{
                y: (typeof window !== 'undefined' ? window.innerHeight : 600) + 40,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                rotate: 360,
                opacity: 0
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                ease: 'linear',
                repeat: Infinity
              }}
              className="absolute w-2.5 h-2.5"
              style={{
                backgroundColor: ['#FFC700', '#58CC02', '#2E96FF', '#F6339A', '#A855F7'][i % 5],
                borderRadius: i % 2 === 0 ? '50%' : '3px'
              }}
            />
          ))}
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-[#1A1920] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl text-center overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg"
          >
            <Trophy className="w-10 h-10 text-amber-400 fill-amber-400/20" />
          </motion.div>

          {/* Round Header */}
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1">
            {roundNumber ? `Раунд ${roundNumber}` : 'Раунд завершён'}
          </span>

          {/* Winner Title */}
          <h2 className="text-2xl sm:text-3xl font-black font-unbounded text-white mb-2 truncate max-w-full">
            {winnerName || 'Победитель!'}
          </h2>

          <p className="text-sm text-text-secondary mb-6">
            Забирает этот раунд! Самый смешной ответ.
          </p>

          {/* Progress bar for auto-close */}
          <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary ease-linear"
              style={{
                width: `${progress}%`,
                transition: isOpen ? 'width 3.5s linear' : 'none'
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
