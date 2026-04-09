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
      const tactics = JSON.parse(team.tactics_json);

      const formation = tactics.formation || "4-4-2";
      const [defCount, midCount, fwdCount] = formation.split("-").map(Number);

      const allPlayers = db
        .prepare(
          `
        SELECT id, name, position, ovr, teamId 
        FROM players 
        WHERE teamId = ? 
        ORDER BY ovr DESC
      `,
        )
        .all(id) as any[];

      const starters: any[] = [];
      const subs: any[] = [];
      const remaining = [...allPlayers];

      // --- 1. SQUAD SELECTION ---
      // Pick GK
      const gkIndex = remaining.findIndex((p) => p.position === "GK");
      if (gkIndex > -1) starters.push(remaining.splice(gkIndex, 1)[0]);

      const pickPlayers = (
        posGroup: string[],
        count: number,
        target: any[],
      ) => {
        let picked = 0;
        let i = 0;
        while (picked < count && i < remaining.length) {
          if (posGroup.includes(remaining[i].position)) {
            target.push(remaining.splice(i, 1)[0]);
            picked++;
          } else {
            i++;
          }
        }
      };

      pickPlayers(["CB", "LB", "RB", "LWB", "RWB"], defCount, starters);
      pickPlayers(["CM", "CDM", "CAM", "LM", "RM"], midCount, starters);
      pickPlayers(["ST", "CF", "LW", "RW"], fwdCount, starters);

      // Finalize Starters to 11
      while (starters.length < 11 && remaining.length > 0) {
        starters.push(remaining.splice(0, 1)[0]);
      }

      // --- 2. BENCH SELECTION (7 Subs) ---
      const subGkIdx = remaining.findIndex((p) => p.position === "GK");
      if (subGkIdx > -1) subs.push(remaining.splice(subGkIdx, 1)[0]);

      pickPlayers(["CB", "LB", "RB"], 1, subs);
      pickPlayers(["CM", "CDM", "CAM"], 1, subs);
      pickPlayers(["ST", "CF", "LW", "RW"], 1, subs);

      while (subs.length < 7 && remaining.length > 0) {
        subs.push(remaining.splice(0, 1)[0]);
      }

      // --- 3. CALCULATE AVG OVR ---
      const avgOvr =
        starters.length > 0
          ? Math.round(
              starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length,
            )
          : 0;

      // --- 4. TACTICAL GRID MAPPING ---
      const formationCoords: Record<string, { x: number; y: number }[]> = {
        "4-4-2": [
          { x: 50, y: 10 }, // GK
          { x: 15, y: 25 },
          { x: 38, y: 22 },
          { x: 62, y: 22 },
          { x: 85, y: 25 }, // DEF
          { x: 15, y: 55 },
          { x: 38, y: 50 },
          { x: 62, y: 50 },
          { x: 85, y: 55 }, // MID
          { x: 40, y: 80 },
          { x: 60, y: 80 }, // FWD
        ],
        "4-3-3": [
          { x: 50, y: 10 }, // GK
          { x: 15, y: 25 },
          { x: 38, y: 22 },
          { x: 62, y: 22 },
          { x: 85, y: 25 }, // DEF
          { x: 25, y: 50 },
          { x: 50, y: 45 },
          { x: 75, y: 50 }, // MID
          { x: 20, y: 75 },
          { x: 50, y: 80 },
          { x: 80, y: 75 }, // FWD
        ],
        "4-2-3-1": [
          { x: 50, y: 10 }, // GK
          { x: 15, y: 25 },
          { x: 38, y: 22 },
          { x: 62, y: 22 },
          { x: 85, y: 25 }, // DEF
          { x: 35, y: 42 },
          { x: 65, y: 42 }, // CDM (2)
          { x: 15, y: 65 },
          { x: 50, y: 65 },
          { x: 85, y: 65 }, // CAM/Wings (3)
          { x: 50, y: 85 }, // ST (1)
        ],
        "5-3-2": [
          { x: 50, y: 10 }, // GK
          { x: 10, y: 30 },
          { x: 30, y: 22 },
          { x: 50, y: 20 },
          { x: 70, y: 22 },
          { x: 90, y: 30 }, // DEF (5)
          { x: 25, y: 50 },
          { x: 50, y: 48 },
          { x: 75, y: 50 }, // MID (3)
          { x: 35, y: 80 },
          { x: 65, y: 80 }, // FWD (2)
        ],
        "4-1-2-1-2": [
          { x: 50, y: 10 }, // GK
          { x: 15, y: 25 },
          { x: 38, y: 22 },
          { x: 62, y: 22 },
          { x: 85, y: 25 }, // DEF
          { x: 50, y: 40 }, // CDM (1)
          { x: 25, y: 55 },
          { x: 75, y: 55 }, // CM (2)
          { x: 50, y: 68 }, // CAM (1)
          { x: 35, y: 82 },
          { x: 65, y: 82 }, // FWD (2)
        ],
        "4-2-4": [
          { x: 50, y: 10 }, // GK
          { x: 15, y: 25 },
          { x: 38, y: 22 },
          { x: 62, y: 22 },
          { x: 85, y: 25 }, // DEF
          { x: 35, y: 50 },
          { x: 65, y: 50 }, // MID (2)
          { x: 15, y: 80 },
          { x: 40, y: 85 },
          { x: 60, y: 85 },
          { x: 85, y: 80 }, // FWD (4)
        ],
        "3-4-3": [
          { x: 50, y: 10 }, // GK
          { x: 25, y: 22 },
          { x: 50, y: 20 },
          { x: 75, y: 22 }, // DEF
          { x: 15, y: 55 },
          { x: 38, y: 50 },
          { x: 62, y: 50 },
          { x: 85, y: 55 }, // MID
          { x: 20, y: 75 },
          { x: 50, y: 80 },
          { x: 80, y: 75 }, // FWD
        ],
      };

      const coords = formationCoords[formation] || formationCoords["4-4-2"];

      return {
        ...team,
        tactics,
        formation,
        avgOvr,
        starters: starters.map((player, index) => ({
          ...player,
          coords: coords[index] || { x: 50, y: 50 },
        })),
        subs,
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
  const events: any[] = [];
  const homeStrength = home.elo_rating * 0.6 + home.avgOvr * 15 + 50;
  const awayStrength = away.elo_rating * 0.6 + away.avgOvr * 15;
  const total = homeStrength + awayStrength;

  let homeGoals = 0;
  let awayGoals = 0;

  const runDiscipline = (team: any, isHome: boolean) => {
    const style = team.tactics.style?.toLowerCase() || "";
    const depth = team.tactics.depth || 50;
    const buildUp = team.tactics.buildUp?.toLowerCase() || "";
    let aggressionFactor = depth / 100;

    if (style.includes("overload")) aggressionFactor += 0.4;
    if (style.includes("high line")) aggressionFactor += 0.2;
    if (buildUp.includes("fast")) aggressionFactor += 0.1;

    team.starters.forEach((player: any) => {
      if (Math.random() < 0.12 * aggressionFactor) {
        const isRed = Math.random() < 0.15;
        events.push({
          type: isRed ? "RED" : "YELLOW",
          minute: Math.floor(Math.random() * 90) + 1,
          playerName: player.name,
          playerId: player.id,
          teamId: team.id,
          isHome,
        });
      }
    });
  };

  runDiscipline(home, true);
  runDiscipline(away, false);

  const createEvents = (strength: number, team: any, isHome: boolean) => {
    const lambda = (strength / total) * 2.5;
    let L = Math.exp(-lambda),
      k = 0,
      p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    const goalCount = k - 1;

    for (let i = 0; i < goalCount; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      const availableScorers = team.starters.filter((p: any) => {
        const redCard = events.find(
          (e) => e.playerId === p.id && e.type === "RED",
        );
        return !redCard || redCard.minute > minute;
      });

      if (availableScorers.length === 0) continue;

      const weights = availableScorers.map((p: any) => {
        if (["ST", "CF", "LW", "RW"].includes(p.position)) return 4;
        if (["CM", "CAM", "LM", "RM"].includes(p.position)) return 2;
        return 1;
      });

      const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
      let random = Math.random() * totalWeight;
      let scorer = availableScorers[0];

      for (let j = 0; j < availableScorers.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          scorer = availableScorers[j];
          break;
        }
      }

      events.push({
        type: "GOAL",
        minute,
        scorerName: scorer.name,
        playerId: scorer.id,
        teamId: team.id,
        isHome,
      });

      if (isHome) homeGoals++;
      else awayGoals++;
    }
  };

  createEvents(homeStrength, home, true);
  createEvents(awayStrength, away, false);
  events.sort((a, b) => a.minute - b.minute);

  return {
    homeGoals,
    awayGoals,
    events,
    winnerId:
      homeGoals > awayGoals ? home.id : awayGoals > homeGoals ? away.id : null,
    attendance: Math.floor(Math.random() * 20000) + 10000,
  };
}
