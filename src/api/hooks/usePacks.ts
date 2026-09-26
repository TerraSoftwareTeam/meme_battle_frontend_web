import { useQuery } from '@tanstack/react-query';
import { api } from '../client';
import { MemePackDto, SituationPackDto, MemePackDetailsResponse, SituationPackDetailsResponse } from '../types/game';

export function useMemePacks() {
  return useQuery({
    queryKey: ['packs', 'memes'],
    queryFn: () => api.get<MemePackDto[]>('/games/packs/memes'),
  });
}

export function useSituationPacks() {
  return useQuery({
    queryKey: ['packs', 'situations'],
    queryFn: () => api.get<SituationPackDto[]>('/games/packs/situations'),
  });
}

export function useMemePack(id?: string) {
  return useQuery({
    queryKey: ['packs', 'memes', id],
    queryFn: () => api.get<MemePackDetailsResponse>(`/games/packs/memes/${id}`),
    enabled: !!id,
  });
}

export function useSituationPack(id?: string) {
  return useQuery({
    queryKey: ['packs', 'situations', id],
    queryFn: () => api.get<SituationPackDetailsResponse>(`/games/packs/situations/${id}`),
    enabled: !!id,
  });
}
