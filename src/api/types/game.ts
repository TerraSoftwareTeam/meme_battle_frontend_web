// WebSocket Events & Centrifugo

export interface CentrifugoPushEnvelope {
  event_id?: string;
  event_type: string;
  game_id?: string;
  user_id?: string;
  occurred_at?: string;
  version?: number;
  payload: any;
}

export type GameEvent = 
  | { type: "player_joined"; user_id: string; players_count: number; handle: string }
  | { type: "player_left"; user_id: string; players_count: number }
  | { type: "player_ready_changed"; user_id: string; is_ready: boolean }
  | { type: "game_started"; rounds_count: number; hand_size: number; current_round_number: number }
  | { type: "round_started"; round_id: string; round_number: number; phase: string; prompt_kind: string; prompt_content: string; phase_expires_at: string }
  | { type: "submission_received"; round_id: string; user_id: string; card_id?: string }
  | { type: "round_phase_changed"; round_id: string; phase: string; phase_expires_at: string }
  | { type: "vote_received"; round_id: string; voter_id: string; card_id?: string }
  | { type: "round_finished"; round_id: string; round_number: number; winner_user_id?: string; scoreboard: ScoreboardEntry[]; round_scoreboard: ScoreboardEntry[] }
  | { type: "game_finished"; winner_user_id?: string; final_scoreboard: ScoreboardEntry[] }
  | { type: "LobbyHostIdChanged"; new_host_id: string };

export interface HandCard {
  id: string;
  kind: string;
  image_url?: string;
  text?: string;
}

export interface ScoreboardEntry {
  user_id: string;
  score: number;
  handle?: string;
}

export type LobbyEvent = 
  | { type: "lobby_created"; id: string; name?: string; host_id: string; mode: string; max_rounds: number; hand_size: number; players_count: number; max_players?: number; created_at: string }
  | { type: "lobby_updated"; id: string; players_count: number }
  | { type: "lobby_removed"; id: string };

export type PersonalEvent = 
  | { type: "hand_updated"; round_id: string; cards: HandCard[] };

// Enums

export type GameMode = "situation_to_meme" | "meme_to_situation";
export type GameStatus = "lobby" | "playing" | "finished";
export type RoundPhase = "waiting" | "submitting" | "voting" | "finished";
export type ContentSafetyLevel = "family_friendly" | "spicy" | "explicit";

// DTOs

export interface ActiveGameDto {
  id: string;
  name?: string;
  host_id: string;
  mode: GameMode;
  max_rounds: number;
  hand_size: number;
  players_count: number;
  max_players?: number;
  created_at: string;
}

export interface ActiveGamesResponseDto {
  games: ActiveGameDto[];
}

export interface GameDto {
  id: string;
  name?: string;
  mode: GameMode;
  status: GameStatus;
  version: number;
  host_id?: string;
  host_user_id?: string;
}

export interface BackendGameCard {
  type: 'Meme' | 'Situation';
  data: {
    id: string;
    media_url?: string;
    prompt_text?: string;
  };
}

export interface GameCard {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface PlayerDto {
  user_id: string;
  handle: string;
  is_ready: boolean;
  has_submitted: boolean;
  has_voted?: boolean;
  score: number;
}

export interface RoundSubmissionDto {
  id: string;
  card: GameCard;
  is_mine: boolean;
  user_id?: string;
}

export interface RoundDto {
  id: string;
  round_number: number;
  phase: RoundPhase;
  phase_expires_at?: string;
  prompt?: GameCard;
  has_voted?: boolean;
  my_submission?: GameCard;
  my_submission_id?: string;
  winner_user_id?: string;
  submissions?: RoundSubmissionDto[];
}

export interface GameStateDto {
  game: GameDto;
  my_hand: GameCard[];
  players: PlayerDto[];
  round?: RoundDto;
}

export function mapBackendCard(card: any): GameCard {
  if (!card) return card;
  // If it's already mapped (e.g. from local optimistic updates)
  if (card.imageUrl !== undefined || card.text !== undefined) return card as GameCard;

  if (card.type === 'Meme') {
    return {
      id: card.data.id,
      imageUrl: card.data.media_url,
    };
  } else if (card.type === 'Situation') {
    return {
      id: card.data.id,
      text: card.data.prompt_text,
    };
  } else if (card.kind === 'meme') { // WS HandCard format
    return {
      id: card.id,
      imageUrl: card.image_url,
    };
  } else if (card.kind === 'situation') { // WS HandCard format
    return {
      id: card.id,
      text: card.text,
    };
  }
  return { id: card.id || 'unknown' };
}

export function mapGameState(data: any): GameStateDto {
  if (!data) return data;
  return {
    ...data,
    my_hand: (data.my_hand || []).map(mapBackendCard),
    round: data.round ? {
      ...data.round,
      prompt: data.round.prompt ? mapBackendCard(data.round.prompt) : undefined,
      my_submission: data.round.my_submission ? mapBackendCard(data.round.my_submission) : undefined,
      submissions: (data.round.submissions || []).map((s: any) => ({
        ...s,
        card: mapBackendCard(s.card)
      }))
    } : undefined
  };
}

export interface MemePackDto {
  id: string;
  name: string;
  description?: string;
  author_id: string;
  language_code: string;
  is_public: boolean;
  is_official?: boolean;
  safety_level: ContentSafetyLevel;
  created_at: string;
}

export interface PackMemeDetailsDto {
  id: string;
  pack_id: string;
  media_id?: number;
  media_url: string;
}

export interface MemePackDetailsResponse {
  pack: MemePackDto;
  memes: PackMemeDetailsDto[];
}

export interface SituationPackDto {
  id: string;
  name: string;
  description?: string;
  author_id: string;
  language_code: string;
  is_public: boolean;
  is_official?: boolean;
  safety_level: ContentSafetyLevel;
  created_at: string;
}

export interface PackSituationDto {
  id: string;
  pack_id: string;
  prompt_text: string;
}

export interface SituationPackDetailsResponse {
  pack: SituationPackDto;
  situations: PackSituationDto[];
}

// Requests & Responses

export interface CreateGameRequest {
  mode: GameMode;
  name: string;
  handle?: string;
  hand_size?: number;
  max_rounds?: number;
  selected_meme_pack_ids: string[];
  selected_situation_pack_ids: string[];
}

export interface JoinGameRequest {
  handle?: string;
}

export interface ReadyRequest {
  is_ready: boolean;
}

export interface SubmitCardRequest {
  card_id: string;
}

export interface VoteRequest {
  submission_id: string;
}

export interface WsTokenDto {
  connection_token: string;
  game_subscription_token: string;
  personal_subscription_token: string;
}

export interface LobbiesWsTokenDto {
  connection_token: string;
  lobbies_subscription_token: string;
}
