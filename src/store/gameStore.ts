import { create } from 'zustand';
import { GameStateDto, GameEvent, PersonalEvent, mapGameState, mapBackendCard } from '@/api/types';
import { api } from '@/api/client';

export interface RoundWinnerAnnouncement {
  roundNumber: number;
  winnerUserId: string;
  winnerName: string;
}

interface GameStore {
  gameState: GameStateDto | null;
  cardAuthors: Record<string, string>;
  cardVotes: Record<string, string[]>;
  roundWinnerAnnouncement: RoundWinnerAnnouncement | null;
  setRoundWinnerAnnouncement: (announcement: RoundWinnerAnnouncement | null) => void;
  clearRoundWinnerAnnouncement: () => void;
  setGameState: (state: GameStateDto) => void;
  processGameEvent: (event: GameEvent) => void;
  processPersonalEvent: (event: PersonalEvent) => void;
  clear: () => void;
}

export async function fetchGameState(gameId: string, retries = 3, delayMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await api.get<any>(`/games/${gameId}/state`);
      useGameStore.getState().setGameState(mapGameState(data));
      return;
    } catch (err) {
      console.warn(`[GameStore] fetchGameState attempt ${attempt}/${retries} failed`, err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  cardAuthors: {},
  cardVotes: {},
  roundWinnerAnnouncement: null,
  setRoundWinnerAnnouncement: (announcement) => set({ roundWinnerAnnouncement: announcement }),
  clearRoundWinnerAnnouncement: () => set({ roundWinnerAnnouncement: null }),
  setGameState: (state) => set((prev) => {
    // Preserve hand if incoming snapshot is missing cards mid-round
    const currentHand = prev.gameState?.my_hand ?? [];
    const incomingHand = state.my_hand ?? [];
    const finalHand = incomingHand.length > 0 ? incomingHand : currentHand;

    return {
      gameState: {
        ...state,
        my_hand: finalHand,
      }
    };
  }),
  processGameEvent: (event: any) => set((state) => {
    if (!state.gameState) return state;
    const newState = { ...state.gameState };

    switch (event.type) {
      case 'player_joined': {
        const exists = newState.players.some(p => p.user_id === event.user_id);
        if (exists) {
          newState.players = newState.players.map(p =>
            p.user_id === event.user_id ? { ...p, handle: event.handle || p.handle } : p
          );
        } else {
          newState.players = [...newState.players, {
            user_id: event.user_id,
            handle: event.handle || 'Игрок',
            is_ready: true,
            has_submitted: false,
            has_voted: false,
            score: 0
          }];
        }
        break;
      }
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
        fetchGameState(newState.game.id);
        break;
      case 'round_started':
        newState.round = {
          id: event.round_id,
          round_number: event.round_number,
          phase: (event.phase as any) || 'submitting',
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
        
        // Submissions aren't in WS, so fetch them with retry when voting or finished starts
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

      case 'round_finished': {
        if (newState.round) {
          newState.round.phase = 'finished';
          newState.round.winner_user_id = event.winner_user_id;
        }
        // Update scores immediately from event if provided
        if (event.scoreboard && Array.isArray(event.scoreboard)) {
          const scoreMap = new Map<string, number>(event.scoreboard.map((s: any) => [String(s.user_id), Number(s.score) || 0]));
          newState.players = newState.players.map(p => ({
            ...p,
            score: scoreMap.has(p.user_id) ? scoreMap.get(p.user_id)! : p.score
          }));
        }
        fetchGameState(newState.game.id);

        const winnerPlayer = newState.players.find(p => p.user_id === event.winner_user_id);
        const winnerName = winnerPlayer?.handle || event.winner_handle || 'Игрок';
        return {
          gameState: newState,
          roundWinnerAnnouncement: {
            roundNumber: newState.round?.round_number || 1,
            winnerUserId: event.winner_user_id,
            winnerName
          }
        };
      }

      case 'game_finished':
        newState.game = { ...newState.game, status: 'finished' };
        if (event.final_scoreboard && Array.isArray(event.final_scoreboard)) {
          const scoreMap = new Map<string, number>(event.final_scoreboard.map((s: any) => [String(s.user_id), Number(s.score) || 0]));
          newState.players = newState.players.map(p => ({
            ...p,
            score: scoreMap.has(p.user_id) ? scoreMap.get(p.user_id)! : p.score
          }));
        }
        fetchGameState(newState.game.id);
        break;

      case 'LobbyHostIdChanged':
        newState.game = { ...newState.game, host_id: event.new_host_id, host_user_id: event.new_host_id };
        break;
    }
    return { gameState: newState };
  }),
  processPersonalEvent: (event: any) => set((state) => {
    if (!state.gameState) return state;
    const newState = { ...state.gameState };
    if (event.type === 'hand_updated') {
      const cards = event.cards || event.payload?.cards || [];
      newState.my_hand = cards.map(mapBackendCard);
    }
    return { gameState: newState };
  }),
  clear: () => set({ gameState: null, cardAuthors: {}, cardVotes: {}, roundWinnerAnnouncement: null }),
}));
