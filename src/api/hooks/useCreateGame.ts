import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { CreateGameRequest, GameDto } from '../types/game';
import { useAuthStore } from '@/store/authStore';

export function useCreateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateGameRequest) => {
      // POST /games — creator is automatically in the lobby as host, no join needed
      const res = await api.post<GameDto>('/games', data);

      // Refresh user info in case guest token was just created
      const { user, fetchMe } = useAuthStore.getState();
      if (!user) {
        await fetchMe();
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    }
  });
}
