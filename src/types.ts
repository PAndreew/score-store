export type WinCondition = 'HIGHEST_SCORE' | 'LOWEST_SCORE';
export type RoundStructure = 'DYNAMIC' | 'FIXED';

export interface GameTemplate {
  id: string;
  name: string;
  min_players: number;
  max_players: number;
  win_condition: WinCondition;
  round_structure: RoundStructure;
  default_round_names: string[]; 
}

export interface GameSession {
  id: string;
  template_id: string;
  template_name: string;
  played_at: string;
  is_finished: boolean;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  name: string;
  seat_index: number;
}

export interface ScoreEntry {
  session_id: string;
  round_index: number;
  player_id: string;
  value: number;
}

// Composite type for the view
export interface SessionDetails {
  session: GameSession;
  template: GameTemplate;
  players: SessionPlayer[];
  scores: ScoreEntry[];
}