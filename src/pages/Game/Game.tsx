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
import { setupGameSubscriptions } from '@/api/centrifuge';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';

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

  // Track round changes to show winner dialog
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (gameState?.round?.winner_user_id) {
      const winner = gameState.players.find(p => p.user_id === gameState.round!.winner_user_id);
      if (winner) setWinnerName(winner.handle);
    }
  }, [gameState?.round?.winner_user_id, gameState?.players]);

  // Show winner dialog when phase becomes finished
  useEffect(() => {
    if (gameState?.round?.phase === 'finished' && gameState.round.winner_user_id) {
      setShowWinnerDialog(true);
    }
  }, [gameState?.round?.phase, gameState?.round?.winner_user_id]);

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

      // Join the game
      await api.post(`/games/${sessionId}/join`, { handle });

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
      <div className="min-h-screen flex items-center justify-center bg-base text-primary">
        <p className="text-xl font-unbounded animate-pulse">Загрузка...</p>
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

  return (
    <div className="min-h-screen bg-base text-primary flex flex-col md:flex-row overflow-hidden">
      {/* Левая панель - Игроки */}
      <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-border bg-surface p-4 flex flex-col shrink-0">
        <PlayersSidebar players={gameState.players} game={gameState.game} round={gameState.round} />
      </aside>

      {/* Центральная зона - Текущая фаза */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        {renderPhase()}
      </main>

      {/* Правая панель - Информация */}
      <aside className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border bg-surface p-4 flex flex-col shrink-0">
        <GameInfoSidebar game={gameState.game} round={gameState.round} />
      </aside>

      <RoundWinnerDialog 
        isOpen={showWinnerDialog} 
        onClose={() => setShowWinnerDialog(false)}
        winnerName={winnerName}
      />
    </div>
  );
}
