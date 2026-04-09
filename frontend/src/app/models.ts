export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  playstyles: string[];
  playstylePlus: string;
}

export interface PlayerHistory {
  season: string;
  teamId: string;
  goals: number;
  assists: number;
  appearances: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position:
    | "GK"
    | "LB"
    | "CB"
    | "RB"
    | "LWB"
    | "RWB"
    | "CDM"
    | "CM"
    | "CAM"
    | "LM"
    | "RM"
    | "LW"
    | "RW"
    | "ST"
    | "CF";
  ovr: number;
  currentElo: number;
  attributes: PlayerAttributes;
  history: PlayerHistory[];
  age: number;
  nationality_id: string;
}

export interface TeamTactics {
  formation?: string;
  style?: string;
  width?: number;
  depth?: number;
  buildUp?: string;
  chanceCreation?: string;
  mentality?: string; // Optional if you still want to keep it
}

export interface Team {
  id: string;
  name: string;
  league_id: string;
  elo_rating: number;
  tactics: TeamTactics;
  nationality_id: string;
}

export interface ManagerTacticalPreference {
  preferredFormation: string;
  focus: string;
  style: string;
}

export interface Manager {
  id: string;
  name: string;
  age: number;
  tactical_preference: ManagerTacticalPreference;
  prestige: number;
  current_team_id?: string;
  history: string[]; // Array of team IDs
  nationality_id: string;
}

export interface CompetitionRules {
  winning_points: number;
  relegation_spots: number;
  max_subs: number;
}

export interface Competition {
  id: string;
  name: string;
  type: "Domestic League" | "Domestic Cup" | "International";
  format: "League" | "Knockout" | "Group+Knockout";
  season: string;
  rules: CompetitionRules;
}

export interface Nation {
  id: string; // 3-letter ISO code
  name: string;
  confederation: "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";
  flag_url: string;
}

export interface Match {
  id: string;
  competitionId: string;
  matchweek: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  date: string;
}

export interface LeagueTableEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface LeagueTableEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  points: number;
}

export interface LeagueTableEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ("W" | "D" | "L")[]; // Add this line
}
