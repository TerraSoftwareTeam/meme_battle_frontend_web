import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { ActiveGamesResponseDto, CreateGameRequest, GameDto, LobbiesWsTokenDto } from '../types/game';

export function useLobbies() {
  return useQuery({
    queryKey: ['lobbies'],
    queryFn: () => api.get<ActiveGamesResponseDto>('/games'),
    staleTime: 1000,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useLobbiesWsToken() {
  return useQuery({
    queryKey: ['lobbies-ws-token'],
    queryFn: () => api.get<LobbiesWsTokenDto>('/games/catalog/ws-token'),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCreateLobby() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGameRequest) => api.post<GameDto>('/games', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
    }
  });
}

export function useJoinLobby() {
  return useMutation({
    mutationFn: async (data: { gameId: string; handle?: string }) => {
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await api.post<void>(`/games/${data.gameId}/join`, { handle: data.handle });
        } catch (err: any) {
          lastErr = err;
          if (err?.status === 409 && attempt < 2) {
            await new Promise(r => setTimeout(r, 350));
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    },
  });
}
