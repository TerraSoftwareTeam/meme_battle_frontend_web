import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export interface ActiveGameInfoDto {
  game_id: string;
  status: 'lobby' | 'playing' | 'finished';
}

export function useActiveGame() {
  return useQuery<ActiveGameInfoDto | null>({
    queryKey: ['active-game'],
    queryFn: async () => {
      try {
        const res = await api.get<ActiveGameInfoDto>('/games/active');
        return res;
      } catch (err: any) {
        // 404 means no active game — that's ok
        if (err.status === 404 || err.status === 204) return null;
        throw err;
      }
    },
    staleTime: 0,
    retry: false,
  });
}
