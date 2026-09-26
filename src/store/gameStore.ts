import { create } from 'zustand';
import { GameStateDto, GameEvent, PersonalEvent, mapGameState, mapBackendCard } from '@/api/types';
import { api } from '@/api/client';

interface GameStore {
  gameState: GameStateDto | null;
  cardAuthors: Record<string, string>;
  cardVotes: Record<string, string[]>;
  setGameState: (state: GameStateDto) => void;
  processGameEvent: (event: GameEvent) => void;
  processPersonalEvent: (event: PersonalEvent) => void;
  clear: () => void;
}

async function fetchGameState(gameId: string) {
  try {
    const data = await api.get<any>(`/games/${gameId}/state`);
    useGameStore.getState().setGameState(mapGameState(data));
  } catch (err) {
    console.error('Failed to refetch game state', err);
  }
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  cardAuthors: {},
  cardVotes: {},
  setGameState: (state) => set({ gameState: state }),
  processGameEvent: (event) => set((state) => {
    if (!state.gameState) return state;
    const newState = { ...state.gameState };
    // Event reduction logic here
    switch (event.type) {
      case 'player_joined':
        newState.players = [...newState.players, {
          user_id: event.user_id,
          handle: event.handle,
          is_ready: false,
          has_submitted: false,
          score: 0
        }];
        break;
      case 'player_left':
        newState.players = newState.players.filter(p => p.user_id !== event.user_id);
        break;
      case 'player_ready_changed':
        newState.players = newState.players.map(p => 
          p.user_id === event.user_id ? { ...p, is_ready: event.is_ready } : p
        );
        break;
      case 'game_started':
        newState.game = { ...newState.game, status: 'playing' };
        break;
      case 'round_started':
        newState.round = {
          id: event.round_id,
          round_number: event.round_number,
          phase: (event.phase as any),
          prompt: {
            id: `prompt_${event.round_id}`,
            ...(event.prompt_kind === 'meme' ? { imageUrl: event.prompt_content } : { text: event.prompt_content })
          }
        };
        newState.players = newState.players.map(p => ({ ...p, has_submitted: false, has_voted: false }));
        return { gameState: newState, cardAuthors: {}, cardVotes: {} };
      case 'round_phase_changed':
        if (newState.round) {
          newState.round.phase = (event.phase as any);
        }
        // Reset player statuses depending on the new phase
        newState.players = newState.players.map(p => ({
          ...p,
          has_submitted: event.phase === 'voting' || event.phase === 'finished' ? false : p.has_submitted,
          has_voted: event.phase === 'submitting' || event.phase === 'finished' ? false : p.has_voted
        }));
        
        // Submissions aren't in WS, so fetch them when voting starts
        if (event.phase === 'voting' || event.phase === 'finished') {
          fetchGameState(newState.game.id);
        }
        break;
      case 'submission_received': {
        const newCardAuthors = { ...state.cardAuthors };
        if (event.card_id) {
          newCardAuthors[event.card_id] = event.user_id;
        }
        newState.players = newState.players.map(p => 
          p.user_id === event.user_id ? { ...p, has_submitted: true } : p
        );
        return { gameState: newState, cardAuthors: newCardAuthors };
      }
      case 'vote_received': {
        const newCardVotes = { ...state.cardVotes };
        if (event.card_id) {
          const votes = newCardVotes[event.card_id] || [];
          if (!votes.includes(event.voter_id)) {
            newCardVotes[event.card_id] = [...votes, event.voter_id];
          }
        }
        newState.players = newState.players.map(p => 
          p.user_id === event.voter_id ? { ...p, has_voted: true } : p
        );
        return { gameState: newState, cardVotes: newCardVotes };
      }
      case 'round_finished':
        if (newState.round) {
          newState.round.phase = 'finished';
          newState.round.winner_user_id = event.winner_user_id;
        }
        fetchGameState(newState.game.id);
        break;
      case 'game_finished':
        newState.game = { ...newState.game, status: 'finished' };
        fetchGameState(newState.game.id);
        break;
      case 'LobbyHostIdChanged':
        newState.game = { ...newState.game, host_id: event.new_host_id, host_user_id: event.new_host_id };
        break;
    }
    return { gameState: newState };
  }),
  processPersonalEvent: (event) => set((state) => {
    if (!state.gameState) return state;
    const newState = { ...state.gameState };
    if (event.type === 'hand_updated') {
      newState.my_hand = (event.cards || []).map(mapBackendCard);
    }
    return { gameState: newState };
  }),
  clear: () => set({ gameState: null }),
}));
