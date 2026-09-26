import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVoteCard } from '@/api/hooks/useGame';

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
    <div className="flex flex-col items-center w-full max-w-3xl gap-6 h-full animate-in fade-in zoom-in-95 duration-500">
      {/* Prompt */}
      <div className="text-center w-full">
        <h2 className="text-2xl mb-3 font-unbounded text-primary-shadow">Голосование</h2>
        <Card className="w-full min-h-24 flex items-center justify-center p-5 text-lg text-center bg-elevated border-primary/40 shadow-[0_0_20px_rgba(88,204,2,0.1)]">
          {round.prompt?.text || round.prompt?.imageUrl ? (
            round.prompt.imageUrl ? (
              <img src={round.prompt.imageUrl} alt="Prompt" className="max-h-56 object-contain rounded-lg mx-auto" />
            ) : (
              <span style={{ color: '#fff' }} className="w-full text-center font-semibold leading-relaxed">{round.prompt.text}</span>
            )
          ) : (
            <span className="text-text-secondary">Скрыто</span>
          )}
        </Card>
      </div>

      {/* Cards grid */}
      <div className="flex-1 w-full overflow-y-auto hide-scrollbar flex flex-col items-center">
        <p className="text-sm mb-4 text-center text-text-secondary font-semibold tracking-wide uppercase">
          {round.has_voted ? '⏳ Ожидаем остальных...' : '👇 Выберите лучший ответ'}
        </p>
        <div className="flex flex-wrap justify-center gap-4 pb-12 px-2">
          {submissions.map(sub => {
            const realUserId = sub.user_id ?? cardAuthors[sub.card.id];
            const authorHandle = gameState.players.find(p => p.user_id === realUserId)?.handle;
            const realVoteCount = (cardVotes[sub.card.id] || []).length;
            const isSelected = selectedSubmissionId === sub.id;
            const isDisabled = sub.is_mine || round.has_voted;

            const isSituation = !sub.card.imageUrl && !!sub.card.text;

            return (
              <button
                key={sub.id}
                onClick={() => { if (!isDisabled) setSelectedSubmissionId(sub.id); }}
                disabled={isDisabled}
                className={`
                  relative flex flex-col items-center justify-center
                  ${isSituation
                    ? 'w-[45%] min-w-[150px] max-w-[280px]'
                    : 'w-[42%] min-w-[130px] max-w-[200px]'
                  }
                  aspect-[3/4] bg-elevated rounded-2xl border-2 overflow-hidden
                  transition-all duration-200 focus:outline-none
                  ${isSelected
                    ? 'border-primary shadow-[0_0_24px_rgba(88,204,2,0.5)] scale-105 -translate-y-1'
                    : sub.is_mine
                      ? 'border-border/30 opacity-50 cursor-not-allowed'
                      : round.has_voted
                        ? 'border-border/50 cursor-not-allowed'
                        : 'border-border hover:border-primary/50 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer'
                  }
                `}
              >
                {/* Card content */}
                {sub.card.imageUrl ? (
                  <img src={sub.card.imageUrl} alt="" className="w-full h-full object-contain p-2 mx-auto" />
                ) : (
                  <div
                    className="p-3 w-full h-full overflow-y-auto hide-scrollbar flex items-center justify-center text-center text-xs md:text-sm font-semibold leading-relaxed"
                    style={{ color: '#ffffff' }}
                  >
                    {sub.card.text}
                  </div>
                )}

                {/* Author badge — top left */}
                {authorHandle && (
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 bg-black/70 text-white rounded-full backdrop-blur-sm">
                      {trunc(authorHandle)}
                    </span>
                  </div>
                )}

                {/* Vote counter — top right */}
                {realVoteCount > 0 && (
                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 bg-primary text-black rounded-full flex items-center gap-1 shadow-lg">
                      🔥 {realVoteCount}
                    </span>
                  </div>
                )}

                {/* "Your answer" overlay */}
                {sub.is_mine && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none rounded-[14px]">
                    <span className="text-white font-bold text-sm px-3 py-1.5 bg-black/40 rounded-full border border-white/20">
                      Ваш ответ
                    </span>
                  </div>
                )}

                {/* Selected ring */}
                {isSelected && (
                  <div className="absolute inset-0 border-[3px] border-primary rounded-[14px] pointer-events-none" />
                )}

                {/* "Your vote" label after voting */}
                {isSelected && round.has_voted && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-10">
                    <span className="text-primary font-bold bg-black/80 px-2 py-0.5 rounded-full text-xs">
                      ✓ Ваш голос
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vote button */}
      <div className="w-full max-w-sm shrink-0">
        <Button
          size="lg"
          className="w-full h-14 text-lg shadow-xl"
          disabled={!selectedSubmissionId || isPending || round.has_voted}
          onClick={handleVote}
          variant={round.has_voted ? 'surface' : 'primary'}
        >
          {round.has_voted ? '✓ Голос принят' : isPending ? 'Отправка...' : 'Голосовать'}
        </Button>
      </div>
    </div>
  );
}
