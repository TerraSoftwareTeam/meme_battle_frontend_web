import { GameDto, RoundDto } from '@/api/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useQueryClient } from '@tanstack/react-query';

interface GameInfoSidebarProps {
  game: GameDto;
  round?: RoundDto;
}

export function GameInfoSidebar({ game, round }: GameInfoSidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await api.post(`/games/${game.id}/leave`, {});
    } catch (err) {
      console.error('Leave error:', err);
    } finally {
      useGameStore.getState().clear();
      // Invalidate active game cache so the guard doesn't redirect back
      queryClient.setQueryData(['active-game'], null);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-xl text-primary-shadow">
        {game.name ?? 'Лобби'}
      </h2>

      <Card className="flex flex-col gap-2 text-sm p-4">
        <div className="flex justify-between">
          <span className="text-text-secondary">Режим:</span>
          <span>{game.mode === 'situation_to_meme' ? 'Сит → Мем' : 'Мем → Сит'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Статус:</span>
          <span className="text-primary font-semibold capitalize">{game.status}</span>
        </div>
        {round && (
          <div className="flex justify-between">
            <span className="text-text-secondary">Раунд:</span>
            <span className="font-bold text-primary">{round.round_number}</span>
          </div>
        )}
      </Card>

      <div className="mt-auto">
        {game.status === 'lobby' && (
          <Button
            variant="danger"
            className="text-white"
            disabled={isLeaving}
            onClick={handleLeave}
          >
            {isLeaving ? 'Выход...' : 'Покинуть игру'}
          </Button>
        )}
      </div>
    </div>
  );
}
