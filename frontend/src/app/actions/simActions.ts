"use server";

import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");

export async function getSimDataAction(homeTeamId: string, awayTeamId: string) {
  const db = new Database(dbPath);
  try {
    const getTeamData = (id: string) => {
      const team = db
        .prepare("SELECT * FROM teams WHERE id = ?")
        .get(id) as any;
      const squad = db
        .prepare(
          "SELECT ovr FROM players WHERE teamId = ? ORDER BY ovr DESC LIMIT 11",
        )
        .all(id) as { ovr: number }[];

      const avgOvr =
        squad.length > 0
          ? Math.round(squad.reduce((a, b) => a + b.ovr, 0) / squad.length)
          : 0;

      return {
        ...team,
        tactics: JSON.parse(team.tactics_json),
        avgOvr,
      };
    };

    return {
      home: getTeamData(homeTeamId),
      away: getTeamData(awayTeamId),
    };
  } finally {
    db.close();
  }
}

export async function simulateMatchAction(home: any, away: any) {
  // 1. Calculate Win Probability based on ELO and Squad OVR
  const eloDiff = home.elo_rating - away.elo_rating;
  const ovrDiff = home.avgOvr - away.avgOvr;

  // Home Advantage + Strength Weighting
  const homeStrength = home.elo_rating * 0.6 + home.avgOvr * 15 + 50;
  const awayStrength = away.elo_rating * 0.6 + away.avgOvr * 15;

  const winProb = homeStrength / (homeStrength + awayStrength);

  // 2. Poisson-ish Goal Generation
  const generateGoals = (prob: number, isHome: boolean) => {
    const base = isHome ? 1.2 : 1.0; // Home teams score slightly more on average
    const variance = Math.random() * prob * 4;
    return Math.floor(base + variance);
  };

  const homeGoals = generateGoals(winProb, true);
  const awayGoals = generateGoals(1 - winProb, false);

  return {
    homeGoals,
    awayGoals,
    winnerId:
      homeGoals > awayGoals ? home.id : awayGoals > homeGoals ? away.id : null,
    attendance: Math.floor(Math.random() * 20000) + 10000,
  };
}
