export interface FootballMatch {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  status: string;
  market: string;
  result: string | null;
  created_at: string;
}

export interface FootballMarketOption {
  key: string;
  label: string;
  odds: number;
}

export interface FootballMarket {
  marketType: string;
  options: FootballMarketOption[];
}
