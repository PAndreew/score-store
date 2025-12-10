export type WinCondition = 'HIGHEST_SCORE' | 'LOWEST_SCORE';
export type RoundStructure = 'DYNAMIC' | 'FIXED';

export interface GameTemplate {
  id: string;
  name: string; // "Scrabble", "Lórum"
  min_players: number;
  max_players: number;
  win_condition: WinCondition;
  round_structure: RoundStructure;
  // If FIXED, these are the round names (e.g. ["Red King", "Train", ...])
  default_round_names?: string[]; 
}

export interface GameSession {
  id: string;
  template_id: string;
  template_name: string; // Cached for display
  played_at: string; // ISO Date String "2023-10-27"
  is_finished: boolean;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  name: string;
  seat_index: number; // 0, 1, 2...
}

export interface ScoreEntry {
  session_id: string;
  round_index: number; // 0-indexed row
  player_id: string;
  value: number;
}