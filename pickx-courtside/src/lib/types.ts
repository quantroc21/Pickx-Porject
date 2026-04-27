export type TierKey = "bronze" | "silver" | "gold" | "platinum" | "pro";

export interface Tier {
  key: TierKey;
  label: string;
  min: number;
  max: number; // exclusive upper bound; Pro = Infinity
  color: string; // tailwind token
}

export interface Player {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string;
  elo: number;
  wins: number;
  losses: number;
  streak: number; // negative = losing streak
  joinedAt: string;
  badges: string[];
  isActive?: boolean; // present at venue
  last_comment?: string;
  last_comment_time?: string;
}

export interface MatchTeam {
  playerIds: [string, string];
  score: number;
}

export interface Match {
  id: string;
  playedAt: string;
  team1: MatchTeam;
  team2: MatchTeam;
  winner: 1 | 2;
  // Elo delta keyed by player id
  eloDelta: Record<string, number>;
}

export interface Court {
  id: string;
  name: string;
  status: "live" | "warmup" | "open";
  team1: [string, string];
  team2: [string, string];
  scoreT1?: number;
  scoreT2?: number;
  startedAt?: string;
}