"use server";

import Database from "better-sqlite3";
import path from "path";
import { TeamGenerator } from "@/lib/generators/TeamGenerator";
import { Team, LeagueTableEntry } from "@/app/models";

const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");

/**
 * DATABASE MANAGEMENT
 */
export async function deleteAllTeamsAction() {
  const db = new Database(dbPath);
  try {
    // Delete teams and players (to maintain referential integrity)
    db.prepare("DELETE FROM players").run();
    db.prepare("DELETE FROM teams").run();
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('teams', 'players')",
    ).run();
    return {
      success: true,
      message: "Database wiped: All teams and players removed.",
    };
  } catch (e) {
    return { success: false, error: "Failed to clear database." };
  } finally {
    db.close();
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
        "SELECT DISTINCT nationality_id FROM competitions ORDER BY nationality_id",
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
    return db
      .prepare(
        `
        SELECT id, name, type, COALESCE(tier, 99) as tier 
        FROM competitions 
        WHERE nationality_id = ?
        ORDER BY tier ASC, name ASC
      `,
      )
      .all(nationalityId) as {
      id: string;
      name: string;
      type: string;
      tier: number;
    }[];
  } finally {
    db.close();
  }
}

/**
 * GENERATION & PREVIEW (Tier & Nation Aware)
 */
export async function generateTeamPreviewAction(
  leagueId: string,
  nationalityId: string,
) {
  const db = new Database(dbPath);
  try {
    // Fetch tier to ensure correct ELO scaling in the generator
    const league = db
      .prepare("SELECT tier FROM competitions WHERE id = ?")
      .get(leagueId) as { tier: number };
    const tier = league?.tier || 5;

    const newTeam = TeamGenerator.generate(leagueId, nationalityId, tier);
    return { success: true, team: newTeam };
  } catch (e) {
    return { success: false, error: "Failed to generate preview." };
  } finally {
    db.close();
  }
}

export async function saveTeamAction(team: Team) {
  const db = new Database(dbPath);
  try {
    const existing = db
      .prepare("SELECT id FROM teams WHERE name = ?")
      .get(team.name);
    if (existing) return { success: false, error: "Team name already exists." };

    const stmt = db.prepare(`
      INSERT INTO teams (id, name, league_id, elo_rating, tactics_json, nationality_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      team.id,
      team.name,
      team.league_id,
      team.elo_rating,
      JSON.stringify(team.tactics),
      team.nationality_id,
    );
    return { success: true, message: `Successfully saved ${team.name}` };
  } catch (e) {
    return { success: false, error: "Database save failed." };
  } finally {
    db.close();
  }
}

/**
 * CAPACITY MONITORING
 */
export async function getLeagueLimitAction(leagueId: string) {
  const db = new Database(dbPath);
  try {
    const countResult = db
      .prepare("SELECT COUNT(*) as count FROM teams WHERE league_id = ?")
      .get(leagueId) as { count: number };
    const leagueResult = db
      .prepare("SELECT rules_json FROM competitions WHERE id = ?")
      .get(leagueId) as { rules_json: string };

    let maxTeams = 20;
    if (leagueResult?.rules_json) {
      const rules = JSON.parse(leagueResult.rules_json);
      maxTeams =
        rules.total_teams || Math.floor(rules.total_games / 2) + 1 || 20;
    }

    return {
      current: countResult.count,
      max: maxTeams,
      isFull: countResult.count >= maxTeams,
    };
  } finally {
    db.close();
  }
}

/**
 * Fetches all matches for a specific team in a season,
 * including the names of the opponents.
 */
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
  } catch (error) {
    console.error("❌ Error fetching team matches:", error);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Generates the league table for a specific competition and season
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
        SUM(CASE WHEN m.home_goals = m.away_goals AND m.id IS NOT NULL THEN 1 ELSE 0 END) as drawn,
        SUM(CASE WHEN (m.home_team_id = t.id AND m.home_goals < m.away_goals) OR (m.away_team_id = t.id AND m.away_goals < m.home_goals) THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.home_goals ELSE 0 END) + SUM(CASE WHEN m.away_team_id = t.id THEN m.away_goals ELSE 0 END) as gf,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.away_goals ELSE 0 END) + SUM(CASE WHEN m.away_team_id = t.id THEN m.home_goals ELSE 0 END) as ga,
        SUM(CASE WHEN (m.home_team_id = t.id AND m.home_goals > m.away_goals) OR (m.away_team_id = t.id AND m.away_goals > m.home_goals) THEN 3 WHEN m.home_goals = m.away_goals AND m.id IS NOT NULL THEN 1 ELSE 0 END) as points,
        (SELECT group_concat(res, ',') FROM (
          SELECT CASE WHEN (m2.home_team_id = t.id AND m2.home_goals > m2.away_goals) OR (m2.away_team_id = t.id AND m2.away_goals > m2.home_goals) THEN 'W' WHEN m2.home_goals = m2.away_goals THEN 'D' ELSE 'L' END as res
          FROM matches m2 WHERE (m2.home_team_id = t.id OR m2.away_team_id = t.id) AND m2.competition_id = ? AND m2.season_id = ?
          ORDER BY m2.matchweek DESC LIMIT 5
        )) as form
      FROM teams t
      LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id) 
        AND m.competition_id = ? 
        AND m.season_id = ?
      WHERE t.league_id = ? 
      GROUP BY t.id
      ORDER BY points DESC, (gf - ga) DESC, gf DESC
    `;

    const rows = db
      .prepare(query)
      .all(
        competitionId,
        seasonId,
        competitionId,
        seasonId,
        competitionId,
      ) as any[];

    return rows.map((row) => ({
      ...row,
      gd: (row.gf || 0) - (row.ga || 0),
      form: row.form ? row.form.split(",").reverse() : [],
    })) as LeagueTableEntry[];
  } finally {
    db.close();
  }
}

/**
 * Fetches aggregate statistics for a competition season
 */
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

    return {
      totalMatches: basic?.totalMatches || 0,
      totalGoals: basic?.totalGoals || 0,
      goalsPerMatch: basic?.goalsPerMatch || "0.00",
      biggestHomeWin: records?.bHome || "N/A",
      biggestAwayWin: records?.bAway || "N/A",
      highestScoring: records?.hScoring || "N/A",
    };
  } finally {
    db.close();
  }
}
