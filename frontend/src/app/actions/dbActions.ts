"use server";

import Database from "better-sqlite3";
import path from "path";
import { PlayerGenerator } from "@/lib/generators/PlayerGenerator";
import { TeamGenerator } from "@/lib/generators/TeamGenerator";
import { Player, Team, Match, LeagueTableEntry } from "@/app/models";

const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");

/**
 * DATABASE DIAGNOSTICS
 */
export async function checkDb() {
  try {
    const db = new Database(dbPath);
    const result = db
      .prepare("SELECT COUNT(*) as count FROM players")
      .get() as { count: number };
    db.close();
    return { success: true, count: result.count };
  } catch (error) {
    console.error("❌ Database Error:", error);
    return { success: false, error: "Could not connect to database" };
  }
}

/**
 * CASCADING DROPDOWN LOGIC
 */
export async function getNationalitiesAction() {
  const db = new Database(dbPath);
  try {
    const nations = db
      .prepare(
        "SELECT DISTINCT nationality_id FROM teams ORDER BY nationality_id",
      )
      .all() as { nationality_id: string }[];
    return nations.map((n) => n.nationality_id);
  } finally {
    db.close();
  }
}

export async function getLeaguesByNationAction(nationalityId: string) {
  const db = new Database(dbPath);
  try {
    const leagues = db
      .prepare(
        `
      SELECT 
        id, 
        name, 
        COALESCE(tier, 99) as tier -- Default unranked leagues to the bottom
      FROM competitions 
      WHERE nationality_id = ?
      ORDER BY tier ASC, name ASC
    `,
      )
      .all(nationalityId) as { id: string; name: string; tier: number }[];

    return leagues;
  } finally {
    db.close();
  }
}

export async function getTeamsByLeagueAction(leagueId: string) {
  const db = new Database(dbPath);
  try {
    return db
      .prepare("SELECT id, name FROM teams WHERE league_id = ? ORDER BY name")
      .all(leagueId) as { id: string; name: string }[];
  } finally {
    db.close();
  }
}

export async function getTeamLookupAction() {
  const db = new Database(dbPath);
  try {
    const teams = db
      .prepare("SELECT id, name, nationality_id FROM teams")
      .all() as { id: string; name: string; nationality_id: string }[];
    const lookup: Record<string, { name: string; nation: string }> = {};
    teams.forEach((t) => {
      lookup[t.id] = { name: t.name, nation: t.nationality_id };
    });
    return lookup;
  } finally {
    db.close();
  }
}

/**
 * GENERATION ACTIONS
 */
export async function createRegenAction(nationality: string, teamId: string) {
  const db = new Database(dbPath);
  try {
    const positions: Player["position"][] = [
      "ST",
      "CM",
      "CB",
      "GK",
      "LW",
      "RW",
    ];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    const newPlayer = PlayerGenerator.generate(
      randomPos,
      nationality,
      teamId,
      Math.floor(Math.random() * (850 - 700 + 1)) + 700,
    );

    db.prepare(
      `
      INSERT INTO players (id, teamId, name, position, ovr, currentElo, age, attributes, history, nationality_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      newPlayer.id,
      newPlayer.teamId,
      newPlayer.name,
      newPlayer.position,
      newPlayer.ovr,
      newPlayer.currentElo,
      newPlayer.age,
      JSON.stringify(newPlayer.attributes),
      JSON.stringify(newPlayer.history),
      newPlayer.nationality_id,
    );

    return { success: true, player: newPlayer };
  } finally {
    db.close();
  }
}

// frontend/src/app/actions/dbActions.ts

export async function createTeamAction(
  leagueId: string,
  nationalityId: string,
) {
  const db = new Database(dbPath);
  try {
    // 1. Generate the team using the specific league and nation context
    const newTeam = TeamGenerator.generate(leagueId, nationalityId);

    // 2. Check for name collisions
    const existing = db
      .prepare("SELECT id FROM teams WHERE name = ?")
      .get(newTeam.name);
    if (existing) {
      return {
        success: false,
        error: `Collision: ${newTeam.name} already exists.`,
      };
    }

    // 3. Insert into Database
    const stmt = db.prepare(`
      INSERT INTO teams (id, name, league_id, elo_rating, tactics_json, nationality_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newTeam.id,
      newTeam.name,
      newTeam.league_id,
      newTeam.elo_rating,
      JSON.stringify(newTeam.tactics),
      newTeam.nationality_id,
    );

    // 4. Return detailed feedback
    return {
      success: true,
      message: `Successfully created ${newTeam.name}`,
      details: {
        name: newTeam.name,
        league: leagueId,
        nation: nationalityId,
        rating: newTeam.elo_rating,
      },
    };
  } catch (e) {
    console.error("❌ Team Generation Error:", e);
    return { success: false, error: "Database insertion failed." };
  } finally {
    db.close();
  }
}

/**
 * SQUAD & MATCH DATA
 */
export async function getSquadAction(): Promise<Player[]> {
  const db = new Database(dbPath);
  try {
    const players = db.prepare("SELECT * FROM players").all() as any[];
    return players.map((p) => ({
      ...p,
      attributes: JSON.parse(p.attributes),
      history: JSON.parse(p.history),
    }));
  } finally {
    db.close();
  }
}

export async function getTeamMatchesAction(teamId: string, seasonId: string) {
  const db = new Database(dbPath);
  try {
    return db
      .prepare(
        `
      SELECT m.*, ht.name as homeTeamName, at.name as awayTeamName
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.season_id = ?
      ORDER BY m.matchweek ASC
    `,
      )
      .all(teamId, teamId, seasonId) as any[];
  } finally {
    db.close();
  }
}

/**
 * LEAGUE TABLE & SEASON STATS
 */
export async function getLeagueTableAction(
  competitionId: string,
  seasonId: string,
): Promise<LeagueTableEntry[]> {
  const db = new Database(dbPath);
  try {
    const query = `
      SELECT 
        t.id as teamId, t.name as teamName,
        COUNT(m.id) as played,
        SUM(CASE WHEN (m.home_team_id = t.id AND m.home_goals > m.away_goals) OR (m.away_team_id = t.id AND m.away_goals > m.home_goals) THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) as drawn,
        SUM(CASE WHEN (m.home_team_id = t.id AND m.home_goals < m.away_goals) OR (m.away_team_id = t.id AND m.away_goals < m.home_goals) THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.home_goals ELSE m.away_goals END) as gf,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.away_goals ELSE m.home_goals END) as ga,
        SUM(CASE WHEN (m.home_team_id = t.id AND m.home_goals > m.away_goals) OR (m.away_team_id = t.id AND m.away_goals > m.home_goals) THEN 3 WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) as points,
        (SELECT group_concat(res, ',') FROM (
          SELECT CASE WHEN (m2.home_team_id = t.id AND m2.home_goals > m2.away_goals) OR (m2.away_team_id = t.id AND m2.away_goals > m2.home_goals) THEN 'W' WHEN m2.home_goals = m2.away_goals THEN 'D' ELSE 'L' END as res
          FROM matches m2 WHERE (m2.home_team_id = t.id OR m2.away_team_id = t.id) AND m2.competition_id = ? AND m2.season_id = ?
          ORDER BY m2.matchweek DESC LIMIT 5
        )) as form
      FROM teams t
      JOIN matches m ON t.id = m.home_team_id OR t.id = m.away_team_id
      WHERE m.competition_id = ? AND m.season_id = ?
      GROUP BY t.id
      ORDER BY points DESC, (SUM(CASE WHEN m.home_team_id = t.id THEN m.home_goals ELSE m.away_goals END) - SUM(CASE WHEN m.home_team_id = t.id THEN m.away_goals ELSE m.home_goals END)) DESC
    `;
    const rows = db
      .prepare(query)
      .all(competitionId, seasonId, competitionId, seasonId) as any[];
    return rows.map((row) => ({
      ...row,
      gd: row.gf - row.ga,
      form: row.form ? row.form.split(",").reverse() : [],
    })) as LeagueTableEntry[];
  } finally {
    db.close();
  }
}

export async function getSeasonStatsAction(
  competitionId: string,
  seasonId: string,
) {
  const db = new Database(dbPath);
  try {
    const basic = db
      .prepare(
        `SELECT COUNT(*) as totalMatches, SUM(home_goals + away_goals) as totalGoals, ROUND(AVG(home_goals + away_goals), 2) as goalsPerMatch FROM matches WHERE competition_id = ? AND season_id = ?`,
      )
      .get(competitionId, seasonId) as any;

    const records = db
      .prepare(
        `
      SELECT 
        (SELECT ht.name || ' ' || home_goals || '-' || away_goals || ' ' || at.name FROM matches m JOIN teams ht ON m.home_team_id = ht.id JOIN teams at ON m.away_team_id = at.id WHERE competition_id = ? AND season_id = ? ORDER BY (home_goals - away_goals) DESC LIMIT 1) as bHome,
        (SELECT at.name || ' ' || away_goals || '-' || home_goals || ' ' || ht.name FROM matches m JOIN teams ht ON m.home_team_id = ht.id JOIN teams at ON m.away_team_id = at.id WHERE competition_id = ? AND season_id = ? ORDER BY (away_goals - home_goals) DESC LIMIT 1) as bAway,
        (SELECT ht.name || ' ' || home_goals || '-' || away_goals || ' ' || at.name FROM matches m JOIN teams ht ON m.home_team_id = ht.id JOIN teams at ON m.away_team_id = at.id WHERE competition_id = ? AND season_id = ? ORDER BY (home_goals + away_goals) DESC LIMIT 1) as hScoring
    `,
      )
      .get(
        competitionId,
        seasonId,
        competitionId,
        seasonId,
        competitionId,
        seasonId,
      ) as any;

    const topScorer = db
      .prepare(
        `
      SELECT p.name, SUM(mps.goals) as g FROM match_player_stats mps
      JOIN players p ON mps.player_id = p.id JOIN matches m ON mps.match_id = m.id
      WHERE m.competition_id = ? AND m.season_id = ? GROUP BY p.id ORDER BY g DESC LIMIT 1
    `,
      )
      .get(competitionId, seasonId) as any;

    const allMatches = db
      .prepare(
        `SELECT m.*, ht.name as hN, at.name as aN FROM matches m JOIN teams ht ON m.home_team_id = ht.id JOIN teams at ON m.away_team_id = at.id WHERE m.competition_id = ? AND m.season_id = ? ORDER BY m.matchweek ASC`,
      )
      .all(competitionId, seasonId) as any[];

    const teamStreaks: Record<string, any> = {};
    allMatches.forEach((m) => {
      [
        { n: m.hN, g: m.home_goals, o: m.away_goals },
        { n: m.aN, g: m.away_goals, o: m.home_goals },
      ].forEach((t) => {
        if (!teamStreaks[t.n])
          teamStreaks[t.n] = {
            win: 0,
            unbeaten: 0,
            winless: 0,
            loss: 0,
            cW: 0,
            cU: 0,
            cWl: 0,
            cL: 0,
          };
        const s = teamStreaks[t.n];
        if (t.g > t.o) {
          s.cW++;
          s.win = Math.max(s.win, s.cW);
        } else {
          s.cW = 0;
        }
        if (t.g >= t.o) {
          s.cU++;
          s.unbeaten = Math.max(s.unbeaten, s.cU);
        } else {
          s.cU = 0;
        }
        if (t.g <= t.o) {
          s.cWl++;
          s.winless = Math.max(s.winless, s.cWl);
        } else {
          s.cWl = 0;
        }
        if (t.g < t.o) {
          s.cL++;
          s.loss = Math.max(s.loss, s.cL);
        } else {
          s.cL = 0;
        }
      });
    });

    const findMax = (k: string) => {
      let max = 0,
        names: string[] = [];
      Object.entries(teamStreaks).forEach(([name, s]: [string, any]) => {
        if (s[k] > max) {
          max = s[k];
          names = [name];
        } else if (s[k] === max && max > 0) names.push(name);
      });
      return max > 0 ? `${max} matches (${names.join(", ")})` : "N/A";
    };

    return {
      totalMatches: basic?.totalMatches || 0,
      totalGoals: basic?.totalGoals || 0,
      goalsPerMatch: basic?.goalsPerMatch || "0.00",
      // Improved formatting for top scorer
      topScorer:
        topScorer && topScorer.g > 0
          ? `${topScorer.name} (${topScorer.g} goals)`
          : "No goals recorded",
      biggestHomeWin: records?.bHome || "N/A",
      biggestAwayWin: records?.bAway || "N/A",
      highestScoring: records?.hScoring || "N/A",
      winningRun: findMax("win"),
      unbeatenRun: findMax("unbeaten"),
      winlessRun: findMax("winless"),
      losingRun: findMax("loss"),
    };
  } finally {
    db.close();
  }
}

/**
 * Updates competition metadata (Nationality and Tier)
 */
export async function updateCompetitionMetaAction(
  competitionId: string,
  nationalityId: string,
  tier: number,
) {
  const db = new Database(dbPath);
  try {
    const stmt = db.prepare(`
      UPDATE competitions 
      SET nationality_id = ?, tier = ? 
      WHERE id = ?
    `);

    const result = stmt.run(nationalityId, tier, competitionId);

    if (result.changes > 0) {
      return { success: true, message: "Competition updated successfully." };
    } else {
      return { success: false, error: "Competition ID not found." };
    }
  } catch (error) {
    console.error("❌ SQL Update Error:", error);
    return { success: false, error: "Database update failed." };
  } finally {
    db.close();
  }
}
