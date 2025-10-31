export interface GameDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  payout_multiplier: number;
  icon?: string;
}

export interface BetRecord {
  id: string;
  user_id: string;
  game_key: string;
  selection: number;
  wager: number;
  outcome: number;
  payout: number;
  win: number;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  created_at: string;
}
