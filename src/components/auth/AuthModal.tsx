import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const authStore = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (tab === 'login') {
        await authStore.loginUser({ username: handle, password });
      } else {
        await authStore.registerUser({ username: handle, email, password });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    }
  };

  // If user is already logged in (not guest), show their profile info
  if (authStore.isAuthenticated && !authStore.isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-[24px] bg-surface border border-border p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
          <h2 className="text-2xl font-unbounded text-white">Профиль</h2>
          <div className="w-full bg-black/20 p-4 rounded-xl flex flex-col items-center">
            <span className="text-text-secondary">Имя пользователя:</span>
            <span className="text-xl font-bold text-white">{authStore.user?.username}</span>
          </div>
          <Button 
            variant="surface" 
            className="w-full"
            onClick={() => {
              authStore.logout();
              onClose();
            }}
          >
            Выйти
          </Button>
          <Button variant="surface" className="w-full" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[24px] bg-surface border border-border p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-unbounded text-white">Аккаунт</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white">✕</button>
        </div>

        <div className="flex w-full bg-black/40 rounded-xl p-1">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'login' ? 'bg-primary text-bg-surface' : 'text-text-secondary hover:text-white'}`}
            onClick={() => setTab('login')}
          >
            Вход
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'register' ? 'bg-primary text-bg-surface' : 'text-text-secondary hover:text-white'}`}
            onClick={() => setTab('register')}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'register' && (
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
          )}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Имя пользователя</label>
            <Input 
              type="text" 
              value={handle} 
              onChange={e => setHandle(e.target.value)}
              placeholder="meme_lord"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Пароль</label>
            <Input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-warning/20 border border-warning/40 rounded-xl text-warning text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={authStore.isLoading} className="mt-2">
            {authStore.isLoading ? 'Загрузка...' : (tab === 'login' ? 'Войти' : 'Зарегистрироваться')}
          </Button>
        </form>

        {authStore.isGuest && (
          <div className="p-3 bg-black/20 rounded-xl text-center">
            <span className="text-xs text-text-secondary block">
              Вы играете как гость. Авторизуйтесь, чтобы сохранить прогресс.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
