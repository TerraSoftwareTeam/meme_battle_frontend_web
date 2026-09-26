import { BaseLayout } from '@/components/layout/BaseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLobbies, useJoinLobby } from '@/api/hooks/useLobbies';
import { useState } from 'react';
import { JoinLobbyModal } from '@/components/game/JoinLobbyModal';

export function Lobbies() {
  const navigate = useNavigate();
  const { data, isLoading } = useLobbies();
  const { mutate: joinLobby, isPending: isJoining } = useJoinLobby();
  
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const lobbies = data?.games || [];

  const handleJoinSubmit = (handle?: string) => {
    if (!selectedLobbyId) return;
    setJoinError(null);
    
    joinLobby({ gameId: selectedLobbyId, handle }, {
      onSuccess: () => {
        navigate(`/game/${selectedLobbyId}`);
      },
      onError: (err: any) => {
        console.error("Failed to join:", err);
        setJoinError(err.message || 'Ошибка входа в лобби');
      }
    });
  };

  return (
    <BaseLayout>
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-unbounded text-white">Публичные лобби</h1>
          <Button variant="secondary" className="w-auto" onClick={() => navigate('/game/new')}>Создать</Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-text-secondary text-center py-10 animate-pulse">Загрузка...</p>
          ) : lobbies.length === 0 ? (
            <p className="text-text-secondary text-center py-10 bg-surface rounded-2xl border border-border">Нет активных лобби</p>
          ) : (
            lobbies.map(lobby => {
              // Usually max_players = 10 or similar if not specified
              const maxPlayers = lobby.max_players || 8;
              const isFull = lobby.players_count >= maxPlayers;
              return (
                <Card key={lobby.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white">{lobby.name || `Лобби ${lobby.id.slice(0, 8)}`}</h3>
                    <div className="flex gap-2">
                      <Badge className="bg-elevated border-border text-text-secondary">{lobby.mode === 'situation_to_meme' ? 'Ситуация → Мем' : 'Мем → Ситуация'}</Badge>
                      <Badge className={isFull ? 'bg-warning/20 text-warning border-warning/40' : 'bg-primary/20 text-primary border-primary/40'}>
                        {lobby.players_count} / {maxPlayers}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant={isFull ? "surface" : "primary"} 
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
