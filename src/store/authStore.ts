import { create } from 'zustand';
import { api } from '@/api/client';
import { UserDto } from '@/api/types/user';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  
  // Actions
  loginAsGuest: (username?: string) => Promise<void>;
  loginUser: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isGuest: false,
  isLoading: false,

  loginAsGuest: async (username?: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthTokens>('/auth/guest', { username: username || null });
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      set({ isAuthenticated: true, isGuest: true });
      await get().fetchMe();
    } catch (error) {
      console.error('Failed to login as guest:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginUser: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthTokens>('/auth/login', data);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      set({ isAuthenticated: true, isGuest: false });
      await get().fetchMe();
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerUser: async (data: any) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', data);
      // Immediately login after registering
      await get().loginUser({ username: data.username, password: data.password });
    } catch (error) {
      console.error('Failed to register:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isGuest: false });
    // Reload the page to reset state and let the guest interceptor run again if needed
    window.location.reload();
  },

  fetchMe: async () => {
    try {
      const user = await api.get<UserDto>('/user/me');
      set({ user, isAuthenticated: true, isGuest: user.is_guest });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      get().logout();
    }
  }
}));
