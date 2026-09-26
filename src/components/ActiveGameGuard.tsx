import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveGame } from '@/api/hooks/useActiveGame';
import { useAuthStore } from '@/store/authStore';

/**
 * ActiveGameGuard — runs on every page load.
 * Checks GET /games/active:
 *   - If the user is in an active (lobby or playing) game and NOT already on that game's page → redirect to it.
 *   - If the game is finished or no active game → do nothing.
 */
export function ActiveGameGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const { data: activeGame, isSuccess } = useActiveGame();

  useEffect(() => {
    if (!isAuthenticated || !isSuccess) return;

    if (activeGame && activeGame.status !== 'finished') {
      const targetPath = `/game/${activeGame.game_id}`;

      // Don't redirect if we're already on this game's page
      if (!location.pathname.startsWith(targetPath)) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [activeGame, isSuccess, isAuthenticated, location.pathname, navigate]);

  return null;
}
