import { useGameStore } from '@/store/gameStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

import { useQueryClient } from '@tanstack/react-query';

export function GameFinishedPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const handleLeave = () => {
    useGameStore.getState().clear();
    queryClient.setQueryData(['active-game'], null);
    navigate('/');
  };

  if (!gameState) return null;
  const { players } = gameState;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const amIWinner = winner?.user_id === user?.id;

  const truncate = (str: string, len: number) => str.length > len ? str.slice(0, len) + '...' : str;
  const titleText = amIWinner ? 'ВЫ ПОБЕДИЛИ!' : `ПОБЕДИЛ ${truncate(winner?.handle || 'Аноним', 12).toUpperCase()}!`;
  
  return (
    <div className="flex flex-col items-center w-full max-w-2xl gap-8 h-full justify-center text-center animate-in fade-in zoom-in-95 duration-700">
      <h2 className="text-5xl text-primary-shadow font-unbounded px-2">{titleText}</h2>
      
      <div className="flex flex-col gap-4 w-full mt-4">
        {sortedPlayers.map((p, i) => (
          <Card key={p.user_id} className={`flex items-center justify-between p-5 border-2 transition-all ${i === 0 ? 'border-warning bg-warning/10 text-warning shadow-[0_0_20px_rgba(255,184,0,0.4)] scale-110 z-10' : 'border-border bg-surface'} ${p.user_id === user?.id ? 'ring-2 ring-white/20' : ''}`}>
            <div className="flex items-center gap-4">
              <span className={`text-3xl font-bold ${i === 0 ? 'text-warning' : 'text-text-secondary'}`}>
                {i === 0 ? '🏆' : `#${i + 1}`}
              </span>
              <span className={`text-2xl ${i === 0 ? 'font-bold' : 'font-semibold'} ${p.user_id === user?.id ? 'text-white' : ''}`}>
                <span className="break-all">{p.handle || 'Аноним'}</span>
                {p.user_id === user?.id && <span className="text-sm text-text-secondary ml-2 whitespace-nowrap">(Вы)</span>}
              </span>
            </div>
            <span className="text-3xl font-bold font-unbounded">{p.score}</span>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 flex gap-4 w-full max-w-sm">
        <Button className="w-full h-14 text-lg" onClick={handleLeave}>В главное меню</Button>
      </div>
    </div>
  );
}
