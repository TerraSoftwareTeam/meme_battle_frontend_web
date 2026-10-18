import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { 
  MemePackDto, 
  SituationPackDto, 
  MemePackDetailsResponse, 
  SituationPackDetailsResponse,
  CreateMemePackRequest,
  CreateSituationPackRequest,
  UpdateMemePackRequest,
  UpdateSituationPackRequest,
  AddMemesToPackRequest,
  AddSituationsToPackRequest,
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

export function useUpdateMemePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemePackRequest }) =>
      api.patch(`/games/packs/memes/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes'] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes', id] });
    },
  });
}

export function useUpdateSituationPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSituationPackRequest }) =>
      api.patch(`/games/packs/situations/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations'] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations', id] });
    },
  });
}

export function useDeleteMemePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/games/packs/memes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes'] });
    },
  });
}

export function useDeleteSituationPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/games/packs/situations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations'] });
    },
  });
}

export function useAddMemesToPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mediaIds }: { id: string; mediaIds: number[] }) =>
      api.post(`/games/packs/memes/${id}/memes`, { media_ids: mediaIds } as AddMemesToPackRequest),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes', id] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes'] });
    },
  });
}

export function useDeleteMemeFromPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, memeId }: { packId: string; memeId: string }) =>
      api.delete(`/games/packs/memes/${packId}/memes/${memeId}`),
    onSuccess: (_, { packId }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes', packId] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'memes'] });
    },
  });
}

export function useAddSituationsToPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prompts }: { id: string; prompts: string[] }) =>
      api.post(`/games/packs/situations/${id}/situations`, { prompts } as AddSituationsToPackRequest),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations', id] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations'] });
    },
  });
}

export function useDeleteSituationFromPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, situationId }: { packId: string; situationId: string }) =>
      api.delete(`/games/packs/situations/${packId}/situations/${situationId}`),
    onSuccess: (_, { packId }) => {
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations', packId] });
      queryClient.invalidateQueries({ queryKey: ['packs', 'situations'] });
    },
  });
}
