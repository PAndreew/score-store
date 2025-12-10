export interface Game {
  id: string;
  name: string;
  created_at: number;
  // Encoded JSON for rules, e.g., "SUM", "AVERAGE"
  rule_type: 'SUM' | 'AVG' | 'MAX'; 
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  order_index: number;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
}

export interface Score {
  round_id: string;
  player_id: string;
  value: number;
}

// A combined type for the UI grid
export type GridRow = {
  round: Round;
  scores: Record<string, number>; // key is player_id
};