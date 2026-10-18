import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { useVoteCard } from '@/api/hooks/useGame';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const trunc = (s: string, n = 12) => s.length > n ? s.slice(0, n) + '…' : s;

export function VotingPhase() {
  const gameState = useGameStore(state => state.gameState);
  const cardAuthors = useGameStore(state => state.cardAuthors);
  const cardVotes = useGameStore(state => state.cardVotes);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  
  const { mutate: voteCard, isPending } = useVoteCard();

  if (!gameState || !gameState.round) return null;
  const { game, round } = gameState;
  const submissions = round.submissions || [];

  const handleVote = () => {
    if (selectedSubmissionId) {
      voteCard({ gameId: game.id, submissionId: selectedSubmissionId }, {
        onSuccess: () => {
          useGameStore.setState(state => {
            if (!state.gameState || !state.gameState.round) return state;
            return { 
              gameState: { 
                ...state.gameState, 
                round: { ...state.gameState.round, has_voted: true } 
              } 
            };
          });
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl gap-5 h-full">
      {/* Header */}
      <motion.div
        className="text-center w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-black font-unbounded text-primary mb-3">
          Голосование
        </h2>
        {/* Prompt */}
        <div className="w-full min-h-16 flex items-center justify-center p-4 rounded-2xl border border-border bg-surface">
          {round.prompt?.imageUrl ? (
            <img src={round.prompt.imageUrl} alt="Prompt" className="max-h-48 object-contain rounded-xl mx-auto" />
          ) : round.prompt?.text ? (
            <span className="text-base sm:text-lg font-semibold leading-relaxed text-center text-white">
              {round.prompt.text}
            </span>
          ) : (
            <span className="text-text-secondary">Скрыто</span>
          )}
        </div>
      </motion.div>

      {/* Hint */}
      <p className="text-xs sm:text-sm text-text-secondary font-semibold tracking-wide uppercase">
        {round.has_voted ? 'Ожидаем остальных игроков...' : 'Выберите лучший ответ'}
      </p>

      {/* Cards grid */}
      <div className="flex-1 w-full overflow-y-auto hide-scrollbar">
        <motion.div
          className="flex flex-wrap justify-center gap-3 sm:gap-4 pb-4 px-1"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {submissions.map((sub) => {
            const realUserId = sub.user_id ?? cardAuthors[sub.card.id];
            const authorHandle = gameState.players.find(p => p.user_id === realUserId)?.handle;
            const realVoteCount = (cardVotes[sub.card.id] || []).length;
            const isSelected = selectedSubmissionId === sub.id;
            const isDisabled = sub.is_mine || round.has_voted;
            const isSituation = !sub.card.imageUrl && !!sub.card.text;

            return (
              <motion.button
                key={sub.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.88, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } }
                }}
                onClick={() => { if (!isDisabled) setSelectedSubmissionId(sub.id); }}
                disabled={isDisabled}
                whileTap={!isDisabled ? { scale: 0.97 } : {}}
                type="button"
                className={`
                  relative flex flex-col items-center justify-center
                  ${isSituation ? 'w-[45%] min-w-[140px] max-w-[260px]' : 'w-[42%] min-w-[120px] max-w-[190px]'}
                  aspect-[3/4] rounded-2xl border-2 overflow-hidden
                  transition-colors duration-150 focus:outline-none
                  ${isSelected
                    ? 'border-primary bg-elevated'
                    : sub.is_mine
                      ? 'border-border/30 bg-elevated/40 opacity-50 cursor-not-allowed'
                      : round.has_voted
                        ? 'border-border/40 bg-elevated/60 cursor-default'
                        : 'border-border bg-surface hover:border-text-secondary/50 cursor-pointer'
                  }
                `}
              >
                {/* Content */}
                {sub.card.imageUrl ? (
                  <img src={sub.card.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="p-3 w-full h-full overflow-y-auto hide-scrollbar flex items-center justify-center text-center text-xs sm:text-sm font-semibold leading-relaxed text-white">
                    {sub.card.text}
                  </div>
                )}

                {/* Author badge */}
                {authorHandle && (
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-black/75 text-white rounded-full backdrop-blur-sm">
                      {trunc(authorHandle)}
                    </span>
                  </div>
                )}

                {/* Selected Check Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-[#16151A] flex items-center justify-center shadow-md pointer-events-none z-10">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                {/* Vote count badge */}
                <AnimatePresence>
                  {realVoteCount > 0 && (
                    <motion.div
                      key={realVoteCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute bottom-2 right-2 z-10 pointer-events-none"
                    >
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-primary text-[#16151A] rounded-full shadow-md">
                        {realVoteCount} {realVoteCount === 1 ? 'голос' : realVoteCount < 5 ? 'голоса' : 'голосов'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* "Your answer" overlay */}
                {sub.is_mine && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none rounded-[14px]">
                    <span className="text-white font-bold text-xs sm:text-sm px-3 py-1.5 bg-black/50 rounded-full border border-white/20">
                      Ваш ответ
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Vote button */}
      <div className="w-full max-w-sm shrink-0">
        <Button
          size="lg"
          className={`w-full h-14 text-lg font-bold ${!round.has_voted ? '!text-[#16151A]' : ''}`}
          disabled={!selectedSubmissionId || isPending || round.has_voted}
          onClick={handleVote}
          variant={round.has_voted ? 'surface' : 'primary'}
        >
          {round.has_voted ? 'Голос принят' : isPending ? 'Отправка...' : 'Проголосовать'}
        </Button>
      </div>
    </div>
  );
}
