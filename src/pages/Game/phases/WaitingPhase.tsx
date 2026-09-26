import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useSetReady, useStartGameSession } from '@/api/hooks/useGame';

export function WaitingPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);

  const { mutate: setReady, isPending: isSettingReady } = useSetReady();
  const { mutate: startGame, isPending: isStarting, error: startError } = useStartGameSession();

  if (!gameState) return null;

  const { game, players } = gameState;
  const hostId = game.host_id || game.host_user_id;
  const isHost = user && hostId === user.id;
  const amIReady = players.find(p => p.user_id === user?.id)?.is_ready ?? false;

  // Assume max players is 8 for UI purposes if not given
  const maxPlayers = 8;
  const readyCount = players.filter(p => p.is_ready).length;
  // During testing, allow starting if all current players are ready (at least 1)
  const canStart = isHost && players.length >= 1 && readyCount === players.length;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-8 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-4xl font-unbounded text-primary-shadow mb-2">Ожидание игроков</h1>
        <p className="text-text-secondary text-lg">
          Лобби: <span className="text-primary font-bold">{game.name ?? game.id}</span>
        </p>
      </div>

      <Card className="w-full p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold border-b border-border pb-2">Настройки игры</h2>
        <div className="grid grid-cols-2 gap-4 text-text-secondary">
          <div>
            <span className="block text-sm">Режим</span>
            <span className="text-primary font-semibold">
              {game.mode === 'situation_to_meme' ? 'Ситуация → Мем' : 'Мем → Ситуация'}
            </span>
          </div>
          <div>
            <span className="block text-sm">Игроков</span>
            <span className="text-primary font-semibold">{players.length} / {maxPlayers}</span>
          </div>
          <div>
            <span className="block text-sm">Готовы</span>
            <span className="text-primary font-semibold">{readyCount} / {players.length}</span>
          </div>
        </div>
      </Card>

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <Button 
          variant="surface" 
          className="flex-1 text-lg h-14"
          disabled={isSettingReady}
          onClick={() => {
            const newReadyState = !amIReady;
            setReady({ gameId: game.id, isReady: newReadyState }, {
              onSuccess: () => {
                useGameStore.setState(state => {
                  if (!state.gameState) return state;
                  const newPlayers = state.gameState.players.map(p => 
                    p.user_id === user?.id ? { ...p, is_ready: newReadyState } : p
                  );
                  return { gameState: { ...state.gameState, players: newPlayers } };
                });
              }
            });
          }}
        >
          {amIReady ? 'Не готов' : 'Готов'}
        </Button>
        {isHost && (
          <Button 
            className="flex-1 text-lg h-14"
            disabled={!canStart || isStarting}
            onClick={() => {
              startGame(game.id);
            }}
          >
            Начать игру
          </Button>
        )}
      </div>

      {isHost && !canStart && (
        <p className="text-warning text-sm text-center">
          Для начала все игроки должны быть готовы.
        </p>
      )}

      {startError && (
        <p className="text-danger font-bold text-center bg-danger/10 p-3 rounded-lg border border-danger/20 w-full">
          Ошибка запуска: {(startError as any).message || 'Недостаточно игроков или карт для игры.'}
        </p>
      )}
    </div>
  );
}
