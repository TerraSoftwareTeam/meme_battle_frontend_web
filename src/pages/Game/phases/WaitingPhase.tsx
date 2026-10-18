import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useSetReady, useStartGameSession } from '@/api/hooks/useGame';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Sparkles, AlertCircle } from 'lucide-react';

export function WaitingPhase() {
  const gameState = useGameStore(state => state.gameState);
  const user = useAuthStore(state => state.user);
  const [copied, setCopied] = useState(false);

  const { mutate: setReady, isPending: isSettingReady } = useSetReady();
  const { mutate: startGame, isPending: isStarting, error: startError } = useStartGameSession();

  if (!gameState) return null;

  const { game, players } = gameState;
  const hostId = game.host_id || game.host_user_id;
  const isHost = user && hostId === user.id;
  const amIReady = players.find(p => p.user_id === user?.id)?.is_ready ?? false;

  const maxPlayers = game.max_players || 10;
  const readyCount = players.filter(p => p.is_ready).length;
  const hasMinPlayers = players.length >= 3;
  const allReady = hasMinPlayers && readyCount === players.length;
  const canStart = isHost && allReady;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md gap-5">
      {/* Title */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-elevated border border-border flex items-center justify-center text-primary">
          <Users size={28} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-unbounded text-white">
          Комната ожидания
        </h1>
      </motion.div>

      {/* Info Card */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <Card className="w-full p-5 flex flex-col gap-4 bg-surface border-border">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-elevated border border-border/50">
              <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Режим</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-1">
                {game.mode === 'situation_to_meme' ? 'Сит → Мем' : 'Мем → Сит'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-elevated border border-border/50">
              <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Игроки</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-1">
                {players.length} / {maxPlayers}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-elevated border border-border/50">
              <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Готовы</span>
              <span className={`text-xs sm:text-sm font-bold mt-1 ${allReady ? 'text-primary' : 'text-warning'}`}>
                {readyCount} / {players.length}
              </span>
            </div>
          </div>

          {/* Copy Invite Link */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border/60">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-white">Пригласить друзей</span>
              <span className="text-[11px] text-text-secondary truncate">Поделитесь ссылкой на комнату</span>
            </div>
            <button
              onClick={handleCopyLink}
              type="button"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface/80 hover:border-text-secondary text-xs font-bold text-white transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-primary" />
                  <span className="text-primary">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-text-secondary" />
                  <span>Ссылка</span>
                </>
              )}
            </button>
          </div>

          {/* Readiness Notice */}
          <div
            className={`p-3.5 rounded-xl border text-center text-xs sm:text-sm font-medium transition-all ${
              allReady
                ? 'bg-primary/10 border-primary/30 text-white'
                : 'bg-elevated/70 border-border/50 text-text-secondary'
            }`}
          >
            {allReady ? (
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <Sparkles size={16} />
                <span>Все игроки готовы! Хост может начать игру.</span>
              </div>
            ) : !hasMinPlayers ? (
              <span>Для начала игры нужно минимум 3 игрока (сейчас: {players.length})</span>
            ) : (
              <span>Ожидаем подтверждения готовности от всех участников</span>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="w-full flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant={amIReady ? 'surface' : 'primary'}
          className={`flex-1 text-base h-13 font-bold ${!amIReady ? '!text-[#16151A]' : ''}`}
          disabled={isSettingReady}
          onClick={() => {
            const newReadyState = !amIReady;
            setReady({ gameId: game.id, isReady: newReadyState }, {
              onSuccess: () => {
                useGameStore.setState(state => {
                  if (!state.gameState) return state;
                  const newPlayers = state.gameState.players.map(p =>
                    p.user_id === user?.id ? { ...p, is_ready: newReadyState } : p
                  );
                  return { gameState: { ...state.gameState, players: newPlayers } };
                });
              }
            });
          }}
        >
          {amIReady ? 'Не готов' : 'Я готов!'}
        </Button>

        {isHost && (
          <Button
            variant="primary"
            className="flex-1 text-base h-13 font-bold !text-[#16151A]"
            disabled={!canStart || isStarting}
            onClick={() => startGame(game.id)}
          >
            {isStarting ? 'Запуск...' : 'Начать игру'}
          </Button>
        )}
      </motion.div>

      {isHost && !canStart && (
        <p className="text-warning text-xs text-center flex items-center justify-center gap-1.5">
          <AlertCircle size={14} />
          <span>
            {!hasMinPlayers
              ? `Для начала игры нужно минимум 3 игрока (сейчас: ${players.length})`
              : 'Для запуска игры все участники должны быть готовы'}
          </span>
        </p>
      )}

      {startError && (
        <p className="text-danger font-semibold text-center bg-danger/10 p-3 rounded-xl border border-danger/20 w-full text-xs sm:text-sm">
          {(startError as any).message || 'Недостаточно игроков или карт для старта.'}
        </p>
      )}
    </div>
  );
}
