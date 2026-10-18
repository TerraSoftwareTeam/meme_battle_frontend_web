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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-unbounded text-white">
          Игроки
        </h2>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-elevated text-text-secondary border border-border/60">
          {players.length}{game.max_players ? ` / ${game.max_players}` : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar">
        {players.map(p => {
          const isHost = p.user_id === hostId;
          const showReady = game.status === 'lobby' && p.is_ready;
          const showWaiting = game.status === 'lobby' && !p.is_ready;
          const showSubmitted = game.status === 'playing' && round?.phase === 'submitting' && p.has_submitted;
          const showVoted = game.status === 'playing' && round?.phase === 'voting' && p.has_voted;

          return (
            <Card key={p.user_id} className="flex items-center gap-3 p-2.5 bg-surface border-border hover:bg-elevated transition-colors">
              <div className="relative w-9 h-9 rounded-full bg-elevated border border-border shrink-0 flex items-center justify-center">
                {/* Default Avatar Placeholder */}
                <span className="text-text-secondary text-xs font-bold">
                  {p.handle ? p.handle.charAt(0).toUpperCase() : '?'}
                </span>
                
                {isHost && (
                  <div className="absolute -top-1.5 -right-1.5 bg-warning text-[#16151A] rounded-full p-0.5 shadow-sm" title="Хост">
                    <Crown size={12} className="fill-current" />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-sm truncate text-white" title={p.handle}>
                  {p.handle}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {p.score} очков
                </span>
              </div>
              
              {showReady && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30" title="Готов">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              {showWaiting && (
                <span className="shrink-0 text-[11px] font-semibold text-text-secondary px-2 py-0.5 rounded-md bg-elevated border border-border/40">
                  Ждёт
                </span>
              )}
              {showSubmitted && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 text-secondary border border-secondary/30" title="Ответил">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              {showVoted && (
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning border border-warning/30" title="Проголосовал">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
