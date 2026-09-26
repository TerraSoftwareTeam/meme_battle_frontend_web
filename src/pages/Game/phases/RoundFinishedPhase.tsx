import { useGameStore } from '@/store/gameStore';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

export function RoundFinishedPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);

  if (!gameState || !gameState.round) return null;
  const { round, players } = gameState;
  
  return (
    <div className="flex flex-col items-center w-full max-w-2xl gap-8 h-full justify-center text-center animate-in fade-in zoom-in-95 duration-500">
      <h2 className="text-4xl text-primary-shadow font-unbounded">Раунд {round.round_number} завершен!</h2>
      
      <div className="flex w-full gap-4 max-w-5xl px-4 flex-col md:flex-row">
        <div className="flex-1 flex flex-col gap-4">
          <h3 className="text-xl font-bold">Таблица лидеров</h3>
          {players.sort((a, b) => b.score - a.score).map((p, i) => (
            <Card key={p.user_id} className={`flex items-center justify-between p-4 border-2 transition-all ${i === 0 ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(88,204,2,0.15)] scale-105' : 'border-border bg-surface'} ${p.user_id === user?.id ? 'ring-2 ring-white/20' : ''}`}>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold ${i === 0 ? 'text-primary' : 'text-text-secondary'}`}>#{i + 1}</span>
                <span className="text-xl font-semibold break-all">
                  {p.handle}
                  {p.user_id === user?.id && <span className="text-sm text-text-secondary ml-2 whitespace-nowrap">(Вы)</span>}
                </span>
              </div>
              <span className="text-2xl font-bold font-unbounded">{p.score}</span>
            </Card>
          ))}
        </div>

        {round.submissions && round.submissions.length > 0 && (
          <div className="flex-1 flex flex-col gap-4 items-center">
            <h3 className="text-xl font-bold">Ответы раунда</h3>
            <div className="flex flex-wrap justify-center gap-4 max-h-[50vh] overflow-y-auto hide-scrollbar pb-4">
              {round.submissions.map(sub => {
                const isWinner = sub.user_id === round.winner_user_id;
                const author = players.find(p => p.user_id === sub.user_id)?.handle || 'Аноним';
                
                return (
                  <div 
                    key={sub.id}
                    className={`relative flex flex-col items-center justify-center w-[45%] min-w-[140px] max-w-[200px] aspect-[4/3] bg-surface rounded-[20px] border-[3px] overflow-hidden ${isWinner ? 'border-warning shadow-[0_0_20px_rgba(255,184,0,0.5)] scale-105 z-10' : 'border-border'}`}
                  >
                    {sub.card.imageUrl ? (
                      <img src={sub.card.imageUrl} alt="" className="w-full h-full object-contain p-2 mx-auto" />
                    ) : (
                      <div className="p-4 w-full h-full flex items-center justify-center text-center text-sm font-medium text-white">
                        {sub.card.text}
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                      <span className="text-white text-[10px] font-bold px-2 py-1 bg-black/70 rounded-full truncate max-w-[80%]">
                        {author}
                      </span>
                      {isWinner && (
                        <span className="text-black text-[10px] font-bold px-2 py-1 bg-warning rounded-full">
                          Победитель
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <p className="text-text-secondary animate-pulse mt-4">Ожидаем начала следующего раунда...</p>
    </div>
  );
}
