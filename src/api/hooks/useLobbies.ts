import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { ActiveGamesResponseDto, CreateGameRequest, GameDto } from '../types/game';

export function useLobbies() {
  return useQuery({
    queryKey: ['lobbies'],
    queryFn: () => api.get<ActiveGamesResponseDto>('/games'),
    refetchInterval: 5000, // Poll every 5s for updates to lobbies
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
    mutationFn: (data: { gameId: string, handle?: string }) => 
      api.post<void>(`/games/${data.gameId}/join`, { handle: data.handle }),
  });
}
