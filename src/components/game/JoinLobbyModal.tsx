import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface JoinLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (handle?: string) => void;
  isJoining: boolean;
  error?: string | null;
}

export function JoinLobbyModal({ isOpen, onClose, onJoin, isJoining, error }: JoinLobbyModalProps) {
  const [handle, setHandle] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(handle.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[24px] bg-surface border border-border p-6 flex flex-col gap-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-unbounded text-white">Вход в лобби</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Ваш ник в игре (необязательно)</label>
            <Input 
              type="text" 
              value={handle} 
              onChange={e => setHandle(e.target.value)}
              placeholder="Введите ник"
              disabled={isJoining}
            />
          </div>

          {error && (
            <div className="p-3 bg-warning/20 border border-warning/40 rounded-xl text-warning text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <Button type="submit" disabled={isJoining}>
              {isJoining ? 'Вход...' : 'Вступить'}
            </Button>
            <Button type="button" variant="surface" onClick={() => navigate('/')} disabled={isJoining}>
              На главную
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
