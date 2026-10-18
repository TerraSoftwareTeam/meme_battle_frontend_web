import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { PlayersSidebar } from './components/PlayersSidebar';
import { GameInfoSidebar } from './components/GameInfoSidebar';

// Phases
import { WaitingPhase } from './phases/WaitingPhase';
import { SubmittingPhase } from './phases/SubmittingPhase';
import { VotingPhase } from './phases/VotingPhase';
import { RoundFinishedPhase } from './phases/RoundFinishedPhase';
import { GameFinishedPhase } from './phases/GameFinishedPhase';
import { JoinLobbyModal } from '@/components/game/JoinLobbyModal';
import { RoundWinnerDialog } from '@/components/game/RoundWinnerDialog';

import { useGameWsToken, useGameState as useGameStateApi } from '@/api/hooks/useGame';
import { setupGameSubscriptions, socketManager } from '@/api/centrifuge';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { fetchGameState } from '@/store/gameStore';

/**
 * Join-on-link flow:
 * 1. User lands on /game/:sessionId with no account
 * 2. api.client auto-gets a guest token on first request
 * 3. GET /games/:id/state → 403 (not a member)
 * 4. We catch the 403, call POST /games/:id/join, then refetch state
 * 5. User is now in the lobby as a guest
 */
export function Game() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const gameState = useGameStore(state => state.gameState);
  const { user, fetchMe } = useAuthStore();

  // Track whether we need to show the join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const { data: initialGameState, error: gameError, refetch: refetchState } = useGameStateApi(sessionId);
  const { data: wsTokens, error: wsError, refetch: refetchWs } = useGameWsToken(
    initialGameState ? sessionId : undefined
  );

  const roundWinnerAnnouncement = useGameStore(state => state.roundWinnerAnnouncement);
  const clearRoundWinnerAnnouncement = useGameStore(state => state.clearRoundWinnerAnnouncement);

  // Sync snapshot winner announcement if page loaded mid-finished phase
  useEffect(() => {
    if (gameState?.round?.phase === 'finished' && gameState.round.winner_user_id && !roundWinnerAnnouncement) {
      const winner = gameState.players.find(p => p.user_id === gameState.round!.winner_user_id);
      useGameStore.setState({
        roundWinnerAnnouncement: {
          roundNumber: gameState.round.round_number,
          winnerUserId: gameState.round.winner_user_id,
          winnerName: winner?.handle || 'Игрок',
        }
      });
    }
  }, [gameState?.round?.phase, gameState?.round?.winner_user_id, gameState?.players, roundWinnerAnnouncement]);

  // Auto-resync when WebSocket reconnects
  useEffect(() => {
    if (!sessionId) return;
    const unsub = socketManager.onReconnect(() => {
      console.log('[Game] Socket reconnected, resyncing snapshot...');
      fetchGameState(sessionId);
    });
    return unsub;
  }, [sessionId]);

  // Auto-resync when returning to the tab
  useEffect(() => {
    if (!sessionId) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchGameState(sessionId);
      }
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sessionId]);

  // Check if we need to show the join modal
  useEffect(() => {
    if (!sessionId || showJoinModal) return;

    // Check errors
    const gErr = gameError as any;
    const wErr = wsError as any;

    if (gErr?.status === 404) {
      navigate('/');
      return;
    }

    // We need to join if:
    // 1. Game state says 403 or 401
    // 2. WS token says 403 or 401
    // 3. We successfully loaded state and user, but user is NOT in the players list
    const isState403 = gErr?.status === 403 || gErr?.status === 401;
    const isWs403 = wErr?.status === 403 || wErr?.status === 401;
    const isMissingFromPlayers = initialGameState && user && !initialGameState.players.some(p => p.user_id === user.id);

    if (isState403 || isWs403 || isMissingFromPlayers) {
      setShowJoinModal(true);
    } else if (gErr) {
      // Other generic state error
      navigate('/');
    }
  }, [gameError, wsError, initialGameState, user, showJoinModal, sessionId, navigate]);

  const handleJoinSubmit = async (handle?: string) => {
    if (!sessionId) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      // Ensure we have an account
      if (!useAuthStore.getState().user) {
        await fetchMe();
      }

      // Join the game (with 1 retry on 409 concurrent conflict)
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await api.post(`/games/${sessionId}/join`, { handle });
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          if (err?.status === 409 && attempt < 2) {
            await new Promise(r => setTimeout(r, 350));
            continue;
          }
          throw err;
        }
      }
      if (lastErr) throw lastErr;

      // Sync the active game cache so guard doesn't interfere
      queryClient.setQueryData(['active-game'], { game_id: sessionId, status: 'lobby' });

      // Refetch everything
      await refetchState();
      await refetchWs();
      
      setShowJoinModal(false);
    } catch (joinErr: any) {
      console.error('Auto-join failed:', joinErr);
      setJoinError(joinErr.message || 'Не удалось вступить в лобби. Возможно, оно уже полное или началось.');
    } finally {
      setIsJoining(false);
    }
  };

  // Sync game state into store
  useEffect(() => {
    if (initialGameState) {
      useGameStore.setState({ gameState: initialGameState });
      // Also sync user from API in case they just got a guest token
      if (!useAuthStore.getState().user) {
        useAuthStore.getState().fetchMe();
      }
    }
  }, [initialGameState]);

  // Setup WebSocket subscriptions once we have tokens and a user
  useEffect(() => {
    if (sessionId && user && wsTokens) {
      const cleanup = setupGameSubscriptions(sessionId, user.id, wsTokens);
      return () => {
        cleanup();
      };
    }
  }, [sessionId, user, wsTokens]);
  // Show join modal if needed
  if (showJoinModal) {
    return (
      <div className="min-h-screen bg-base">
        <JoinLobbyModal 
          isOpen={true} 
          onClose={() => navigate('/')} 
          onJoin={handleJoinSubmit}
          isJoining={isJoining}
          error={joinError}
        />
      </div>
    );
  }


  // Loading
  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base gap-6">
        <div className="text-4xl font-black font-unbounded">
          <span className="text-white">MEME</span>
          <span className="shimmer-text-green">BATTLE</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const renderPhase = () => {
    switch (gameState.game.status) {
      case 'lobby':
        return <WaitingPhase />;
      case 'finished':
        return <GameFinishedPhase />;
      case 'playing':
        if (!gameState.round) return <div>Загрузка раунда...</div>;
        switch (gameState.round.phase) {
          case 'waiting': return <WaitingPhase />;
          case 'submitting': return <SubmittingPhase />;
          case 'voting': return <VotingPhase />;
          case 'finished': return <RoundFinishedPhase />;
          default: return <div>Неизвестная фаза</div>;
        }
    }
  };

  const isGameFinished = gameState.game.status === 'finished';

  return (
    <div className="min-h-screen bg-base text-primary flex flex-col md:flex-row overflow-hidden">
      {/* Левая панель - Игроки (скрыта в конце матча, чтобы не дублировать список) */}
      {!isGameFinished && (
        <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-border bg-surface p-4 flex flex-col shrink-0">
          <PlayersSidebar players={gameState.players} game={gameState.game} round={gameState.round} />
        </aside>
      )}

      {/* Центральная зона - Текущая фаза */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        {renderPhase()}
      </main>

      {/* Правая панель - Информация */}
      <aside className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border bg-surface p-4 flex flex-col shrink-0">
        <GameInfoSidebar game={gameState.game} round={gameState.round} />
      </aside>

      <RoundWinnerDialog 
        isOpen={!!roundWinnerAnnouncement} 
        onClose={clearRoundWinnerAnnouncement}
        winnerName={roundWinnerAnnouncement?.winnerName}
        roundNumber={roundWinnerAnnouncement?.roundNumber}
      />
    </div>
  );
}
