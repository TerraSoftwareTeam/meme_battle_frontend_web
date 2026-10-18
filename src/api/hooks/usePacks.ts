import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { 
  MemePackDto, 
  SituationPackDto, 
  MemePackDetailsResponse, 
  SituationPackDetailsResponse,
  CreateMemePackRequest,
  CreateSituationPackRequest,
  MediaAssetDto
} from '../types/game';

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

export async function uploadImageMedia(file: File): Promise<MediaAssetDto> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return api.upload<MediaAssetDto>('/media/upload/image', formData);
}

export function useCreateMemePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemePackRequest) => api.post<MemePackDto>('/games/packs/memes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes'] });
    },
  });
}

export function useCreateSituationPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSituationPackRequest) => api.post<SituationPackDto>('/games/packs/situations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations'] });
    },
  });
}
