import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export function GameFinishedPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const handleLeave = () => {
    useGameStore.getState().clear();
    queryClient.setQueryData(['active-game'], null);
    queryClient.invalidateQueries({ queryKey: ['lobbies'] });
    navigate('/');
  };

  if (!gameState) return null;
  const { players } = gameState;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const amIWinner = winner?.user_id === user?.id;

  return (
    <div className="flex flex-col items-center w-full max-w-xl gap-6 h-full justify-center text-center py-6">
      {/* Title */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
        className="flex flex-col items-center gap-2"
      >
        <h2 className={`text-4xl sm:text-5xl font-black font-unbounded leading-tight px-2 ${amIWinner ? 'shimmer-text' : 'text-white'}`}>
          {amIWinner ? 'ВЫ ПОБЕДИЛИ!' : `ПОБЕДИЛ\n${winner?.handle || 'Аноним'}!`}
        </h2>
        {!amIWinner && (
          <p className="text-text-secondary text-sm">В следующий раз повезёт</p>
        )}
      </motion.div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-2.5 w-full">
        <AnimatePresence>
          {sortedPlayers.map((p, i) => {
            const isFirst = i === 0;
            const isMe = p.user_id === user?.id;
            return (
              <motion.div
                key={p.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
                className={`
                  flex items-center justify-between p-4 rounded-2xl border-2 transition-all
                  ${isFirst
                    ? 'border-warning bg-warning/10 ring-1 ring-warning/30'
                    : isMe
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 bg-surface'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold w-8 text-center ${isFirst ? 'text-warning' : 'text-text-secondary'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className={`font-bold text-base sm:text-lg leading-tight ${isFirst ? 'text-warning' : 'text-white'}`}>
                      {p.handle || 'Аноним'}
                      {isMe && <span className="ml-2 text-xs text-text-secondary font-normal">(Вы)</span>}
                    </span>
                    {isFirst && <span className="text-xs text-warning/80 font-bold uppercase tracking-wider">Победитель</span>}
                  </div>
                </div>
                <div className={`text-2xl font-black font-unbounded ${isFirst ? 'text-warning' : 'text-white'}`}>
                  {p.score}
                  <span className="text-xs font-normal text-text-secondary ml-1">очк</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div
        className="mt-4 w-full max-w-xs"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          size="lg"
          variant="primary"
          onClick={handleLeave}
          className="w-full h-14 text-lg"
        >
          В главное меню
        </Button>
      </motion.div>
    </div>
  );
}
