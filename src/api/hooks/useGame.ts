import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../client';
import { WsTokenDto } from '../types/game';

import { mapGameState } from '../types/game';

export function useGameState(gameId?: string) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const data = await api.get<any>(`/games/${gameId}/state`);
      return mapGameState(data);
    },
    enabled: !!gameId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useGameWsToken(gameId?: string) {
  return useQuery({
    queryKey: ['game', gameId, 'ws-token'],
    queryFn: () => api.get<WsTokenDto>(`/games/events/${gameId}/ws-token`),
    enabled: !!gameId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSetReady() {
  return useMutation({
    mutationFn: (data: { gameId: string; isReady: boolean }) => 
      api.post<void>(`/games/${data.gameId}/ready`, { is_ready: data.isReady }),
  });
}

export function useStartGameSession() {
  return useMutation({
    mutationFn: (gameId: string) => 
      api.post<void>(`/games/${gameId}/start`),
  });
}

export function useSubmitCard() {
  return useMutation({
    mutationFn: (data: { gameId: string; cardId: string }) => 
      api.post<void>(`/games/${data.gameId}/submit`, { card_id: data.cardId }),
  });
}

export function useVoteCard() {
  return useMutation({
    mutationFn: (data: { gameId: string; submissionId: string }) => 
      api.post<void>(`/games/${data.gameId}/vote`, { submission_id: data.submissionId }),
  });
}
