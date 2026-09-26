import { PlayerDto, GameDto, RoundDto } from '@/api/types';
import { Card } from '@/components/ui/card';
import { Crown, Check } from 'lucide-react';

interface PlayersSidebarProps {
  players: PlayerDto[];
  game: GameDto;
  round?: RoundDto;
}

export function PlayersSidebar({ players, game, round }: PlayersSidebarProps) {
  const hostId = game.host_id || game.host_user_id;

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-xl text-primary-shadow font-unbounded">Игроки ({players.length})</h2>
      <div className="flex flex-col gap-2 overflow-y-auto pr-2 hide-scrollbar">
        {players.map(p => {
          const isHost = p.user_id === hostId;
          const showReady = game.status === 'lobby' && p.is_ready;
          const showSubmitted = game.status === 'playing' && round?.phase === 'submitting' && p.has_submitted;
          const showVoted = game.status === 'playing' && round?.phase === 'voting' && p.has_voted;

          return (
            <Card key={p.user_id} className="flex items-center gap-3 p-3 bg-surface border-border hover:bg-elevated transition-colors">
              <div className="relative w-10 h-10 rounded-full bg-elevated border border-border shrink-0 flex items-center justify-center">
                {/* Default Avatar Placeholder */}
                <span className="text-text-secondary text-sm font-bold">
                  {p.handle ? p.handle.charAt(0).toUpperCase() : '?'}
                </span>
                
                {isHost && (
                  <div className="absolute -top-2 -right-2 bg-warning text-[#16151A] rounded-full p-0.5" title="Хост">
                    <Crown size={14} className="fill-current" />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold truncate text-white" title={p.handle}>
                  {p.handle.length > 12 ? p.handle.slice(0, 12) + '...' : p.handle}
                </span>
                <span className="text-xs text-primary font-bold">{p.score} очков</span>
              </div>
              
              {showReady && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary" title="Готов">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              {showSubmitted && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 text-secondary" title="Ответил">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              {showVoted && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning" title="Проголосовал">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
