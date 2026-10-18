import { useEffect, useState } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLobbies, useLobbiesWsToken, useJoinLobby } from '@/api/hooks/useLobbies';
import { JoinLobbyModal } from '@/components/game/JoinLobbyModal';
import { setupLobbiesSubscription } from '@/api/centrifuge';
import { ActiveGameDto, ActiveGamesResponseDto } from '@/api/types/game';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function Lobbies() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data, isLoading } = useLobbies();
  const { data: wsTokens } = useLobbiesWsToken();
  const { mutate: joinLobby, isPending: isJoining } = useJoinLobby();
  
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Connect to WS and listen for lobby events, updating React Query cache directly
  useEffect(() => {
    if (!wsTokens) return;

    const cleanup = setupLobbiesSubscription(wsTokens, (event: any) => {
      const type = String(event.type || '').toLowerCase();
      const eventGameId = event.id || event.game_id || event.lobby_id;

      if (type === 'lobby_created' || type === 'lobbycreated') {
        const { type: _, ...lobby } = event;
        const newLobby = { ...lobby, id: eventGameId } as ActiveGameDto;
        queryClient.setQueryData<ActiveGamesResponseDto>(['lobbies'], (old) => {
          const currentGames = old?.games ?? [];
          if (currentGames.some(l => l.id === newLobby.id)) return old;
          return {
            ...old,
            games: [newLobby, ...currentGames]
          };
        });
      } else if (type === 'lobby_updated' || type === 'lobbyupdated') {
        queryClient.setQueryData<ActiveGamesResponseDto>(['lobbies'], (old) => {
          if (!old?.games) return old;
          if (event.players_count <= 0) {
            return {
              ...old,
              games: old.games.filter(l => l.id !== eventGameId)
            };
          }
          return {
            ...old,
            games: old.games.map(l => l.id === eventGameId ? { ...l, players_count: event.players_count } : l)
          };
        });
      } else if (
        type === 'lobby_removed' ||
        type === 'lobbyremoved' ||
        type === 'lobby_deleted' ||
        type === 'game_started' ||
        type === 'game_finished'
      ) {
        queryClient.setQueryData<ActiveGamesResponseDto>(['lobbies'], (old) => {
          if (!old?.games) return old;
          return {
            ...old,
            games: old.games.filter(l => l.id !== eventGameId)
          };
        });
      }
    });

    return cleanup;
  }, [wsTokens, queryClient]);

  const lobbies = data?.games ?? [];

  const handleJoinSubmit = (handle?: string) => {
    if (!selectedLobbyId) return;
    setJoinError(null);
    
    joinLobby({ gameId: selectedLobbyId, handle }, {
      onSuccess: () => {
        navigate(`/game/${selectedLobbyId}`);
      },
      onError: (err: any) => {
        console.error('Failed to join:', err);
        setJoinError(err.message || 'Ошибка входа в лобби');
      }
    });
  };

  return (
    <BaseLayout>
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <Button
              type="button"
              variant="surface"
              size="sm"
              onClick={() => navigate('/')}
              className="w-10 h-10 min-h-[40px] p-0 rounded-xl shrink-0"
              title="В главное меню"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-unbounded text-white">Публичные лобби</h1>
          </div>
          <Button variant="secondary" className="w-auto" onClick={() => navigate('/game/new')}>Создать</Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-text-secondary text-center py-10 animate-pulse">Загрузка...</p>
          ) : lobbies.length === 0 ? (
            <p className="text-text-secondary text-center py-10 bg-surface rounded-2xl border border-border">Нет активных лобби</p>
          ) : (
            lobbies.map(lobby => {
              const maxPlayers = lobby.max_players || 10;
              const isFull = lobby.players_count >= maxPlayers;
              return (
                <Card key={lobby.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white">{lobby.name || `Лобби ${lobby.id.slice(0, 8)}`}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-elevated border-border text-text-secondary">
                        {lobby.mode === 'situation_to_meme' ? 'Ситуация → Мем' : 'Мем → Ситуация'}
                      </Badge>
                      <Badge className={isFull ? 'bg-warning/20 text-warning border-warning/40' : 'bg-primary/20 text-primary border-primary/40'}>
                        {lobby.players_count} / {maxPlayers} игроков
                      </Badge>
                      {lobby.max_rounds && (
                        <Badge className="bg-elevated border-border text-text-secondary">
                          {lobby.max_rounds} раундов
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant={isFull ? 'surface' : 'primary'} 
                    className="w-full sm:w-auto min-w-[160px]"
                    disabled={isFull || isJoining}
                    onClick={() => setSelectedLobbyId(lobby.id)}
                  >
                    {isFull ? 'Заполнено' : 'Присоединиться'}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <JoinLobbyModal
        isOpen={!!selectedLobbyId}
        onClose={() => {
          setSelectedLobbyId(null);
          setJoinError(null);
        }}
        onJoin={handleJoinSubmit}
        isJoining={isJoining}
        error={joinError}
      />
    </BaseLayout>
  );
}
