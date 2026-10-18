import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { useSubmitCard } from '@/api/hooks/useGame';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function SubmittingPhase() {
  const gameState = useGameStore(state => state.gameState);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);
  
  const { mutate: submitCard, isPending } = useSubmitCard();

  if (!gameState || !gameState.round) return null;
  const { game, round, my_hand } = gameState;

  const hasSubmitted = gameState.players.find(p => p.user_id === user?.id)?.has_submitted;

  const handleSubmit = () => {
    if (selectedCardId) {
      submitCard({ gameId: game.id, cardId: selectedCardId }, {
        onSuccess: () => {
          useGameStore.setState(state => {
            if (!state.gameState) return state;
            const newPlayers = state.gameState.players.map(p => 
              p.user_id === user?.id ? { ...p, has_submitted: true } : p
            );
            return { gameState: { ...state.gameState, players: newPlayers } };
          });
        }
      });
    }
  };

  if (hasSubmitted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full gap-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mb-1">
          <Check size={24} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-black font-unbounded text-white">Ответ принят</h2>
        <p className="text-text-secondary text-center text-sm">Ждём, пока остальные игроки сделают выбор...</p>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl gap-5 h-full">
      {/* Header */}
      <motion.div
        className="text-center w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Раунд</span>
          <span className="text-lg font-black font-unbounded text-primary">{round.round_number}</span>
        </div>
        {/* Prompt card */}
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

      <p className="text-xs sm:text-sm text-text-secondary font-semibold tracking-wide uppercase">
        Выберите карту из руки
      </p>

      {/* Hand */}
      <div className="flex-1 w-full overflow-y-auto hide-scrollbar">
        <motion.div
          className="flex flex-wrap justify-center gap-3 sm:gap-4 pb-4 px-1"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {my_hand.map((card) => {
            const isSelected = selectedCardId === card.id;
            const isSituation = !card.imageUrl && !!card.text;
            return (
              <motion.button
                key={card.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.88, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } }
                }}
                onClick={() => setSelectedCardId(card.id)}
                whileTap={{ scale: 0.97 }}
                type="button"
                className={`
                  relative flex flex-col items-center justify-center
                  ${isSituation ? 'w-[45%] min-w-[130px] max-w-[210px]' : 'w-[28%] min-w-[95px] max-w-[145px]'}
                  aspect-[3/4] rounded-2xl border-2 overflow-hidden
                  transition-colors duration-150 focus:outline-none cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-elevated'
                    : 'border-border bg-surface hover:border-text-secondary/50'
                  }
                `}
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="p-3 w-full h-full overflow-y-auto hide-scrollbar flex items-center justify-center text-center text-xs sm:text-sm font-semibold leading-relaxed text-white">
                    {card.text}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Submit */}
      <div className="w-full max-w-sm shrink-0">
        <Button
          size="lg"
          variant="primary"
          className="w-full h-14 text-lg font-bold !text-[#16151A]"
          disabled={!selectedCardId || isPending}
          onClick={handleSubmit}
        >
          {isPending ? 'Отправка...' : 'Сыграть карту'}
        </Button>
      </div>
    </div>
  );
}
