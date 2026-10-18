import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export function RoundFinishedPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);

  if (!gameState || !gameState.round) return null;
  const { round, players } = gameState;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winnerPlayer = players.find(p => p.user_id === round.winner_user_id);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl gap-6 h-full justify-center text-center py-4">

      {/* Round winner banner */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex flex-col items-center gap-1.5"
      >
        <h2 className="text-2xl sm:text-3xl font-black font-unbounded text-white">
          Раунд {round.round_number} завершён
        </h2>
        {winnerPlayer && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-base sm:text-lg text-text-secondary"
          >
            Победитель раунда: <span className="text-warning font-bold">{winnerPlayer.handle}</span>
          </motion.p>
        )}
      </motion.div>

      <div className="flex w-full gap-4 flex-col md:flex-row">

        {/* Leaderboard */}
        <div className="flex-1 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Таблица счёта</h3>
          <AnimatePresence>
            {sortedPlayers.map((p, i) => {
              const isFirst = i === 0;
              const isMe = p.user_id === user?.id;
              return (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                    ${isFirst ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-surface'}
                    ${isMe ? 'ring-1 ring-white/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-bold w-7 text-center ${isFirst ? 'text-primary' : 'text-text-secondary'}`}>
                      #{i + 1}
                    </span>
                    <span className={`font-bold ${isFirst ? 'text-primary' : 'text-white'}`}>
                      {p.handle}
                      {isMe && <span className="ml-1 text-xs text-text-secondary">(Вы)</span>}
                    </span>
                  </div>
                  <span className={`text-xl font-black font-unbounded ${isFirst ? 'text-primary' : 'text-white'}`}>
                    {p.score}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Submissions */}
        {round.submissions && round.submissions.length > 0 && (
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ответы раунда</h3>
            <div className="flex flex-wrap justify-center gap-3 max-h-[45vh] overflow-y-auto hide-scrollbar pb-4">
              {round.submissions.map((sub, i) => {
                const isWinner = sub.user_id === round.winner_user_id;
                const author = players.find(p => p.user_id === sub.user_id)?.handle || 'Аноним';
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: isWinner ? 1.04 : 1 }}
                    transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 220, damping: 20 }}
                    className={`
                      relative flex flex-col items-center justify-center
                      w-[44%] min-w-[130px] max-w-[180px] aspect-[3/4]
                      rounded-2xl border-[2px] overflow-hidden
                      ${isWinner
                        ? 'border-warning ring-1 ring-warning/30 bg-warning/5'
                        : 'border-border/50 bg-surface'
                      }
                    `}
                  >
                    {sub.card.imageUrl ? (
                      <img src={sub.card.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="p-3 w-full h-full flex items-center justify-center text-center text-xs sm:text-sm font-semibold leading-snug" style={{ color: '#fff' }}>
                        {sub.card.text}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1">
                      <span className="text-white text-[10px] font-bold px-2 py-0.5 bg-black/75 rounded-full truncate max-w-[65%] backdrop-blur-sm">
                        {author}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-warning text-black rounded-full whitespace-nowrap">
                          Победа
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p className="text-text-secondary text-xs sm:text-sm">
        Следующий раунд скоро начнётся...
      </p>
    </div>
  );
}
