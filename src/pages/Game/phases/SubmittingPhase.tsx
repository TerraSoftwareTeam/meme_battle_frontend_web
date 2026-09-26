import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubmitCard } from '@/api/hooks/useGame';
import { useAuthStore } from '@/store/authStore';


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
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in duration-500">
        <div className="text-5xl">⏳</div>
        <h2 className="text-2xl font-bold">Ждём остальных игроков...</h2>
        <p className="text-text-secondary text-center">Вы уже сделали свой выбор</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl gap-6 h-full animate-in fade-in zoom-in-95 duration-500">
      {/* Prompt */}
      <div className="text-center w-full">
        <h2 className="text-2xl mb-3 font-unbounded text-primary-shadow">
          Раунд {round.round_number}
        </h2>
        <Card className="w-full min-h-24 flex items-center justify-center p-5 text-lg text-center border-primary/60 bg-primary/10 shadow-[0_0_20px_rgba(88,204,2,0.12)]">
          {round.prompt?.text || round.prompt?.imageUrl ? (
            round.prompt.imageUrl ? (
              <img src={round.prompt.imageUrl} alt="Prompt" className="max-h-56 object-contain rounded-lg mx-auto" />
            ) : (
              <span style={{ color: '#ffffff' }} className="w-full text-center font-semibold leading-relaxed">
                {round.prompt.text}
              </span>
            )
          ) : (
            <span className="text-text-secondary">Скрыто</span>
          )}
        </Card>
      </div>

      {/* Hand */}
      <div className="flex-1 w-full overflow-y-auto hide-scrollbar flex flex-col items-center">
        <p className="text-sm mb-4 text-center text-text-secondary font-semibold tracking-wide uppercase">
          👆 Выберите карту из руки
        </p>
        <div className="flex flex-wrap justify-center gap-4 pb-12 px-2">
          {my_hand.map(card => {
            const isSelected = selectedCardId === card.id;
            // Situation text cards need more space
            const isSituation = !card.imageUrl && !!card.text;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  ${isSituation
                    ? 'w-[45%] min-w-[140px] max-w-[220px]'
                    : 'w-[28%] min-w-[100px] max-w-[150px]'
                  }
                  aspect-[3/4] bg-elevated rounded-2xl border-2 overflow-hidden
                  transition-all duration-200 focus:outline-none
                  ${isSelected
                    ? 'border-primary shadow-[0_0_24px_rgba(88,204,2,0.5)] scale-105 -translate-y-2'
                    : 'border-border hover:border-primary/40 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer'
                  }
                `}
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-full h-full object-contain p-2 mx-auto" />
                ) : (
                  <div
                    className="p-3 w-full h-full overflow-y-auto hide-scrollbar flex items-center justify-center text-center text-xs md:text-sm font-semibold leading-relaxed"
                    style={{ color: '#ffffff' }}
                  >
                    {card.text}
                  </div>
                )}

                {isSelected && (
                  <div className="absolute inset-0 border-[3px] border-primary rounded-[14px] pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      <div className="w-full max-w-sm shrink-0">
        <Button
          size="lg"
          className="w-full h-14 text-lg shadow-xl"
          disabled={!selectedCardId || isPending}
          onClick={handleSubmit}
        >
          {isPending ? 'Отправка...' : '▶ Выбрать карту'}
        </Button>
      </div>
    </div>
  );
}
