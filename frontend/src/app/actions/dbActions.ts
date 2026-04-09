"use server";

import Database from "better-sqlite3";
import path from "path";
import { TeamGenerator } from "@/lib/generators/TeamGenerator";
import { Team } from "@/app/models";

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
        SELECT id, name, COALESCE(tier, 99) as tier 
        FROM competitions 
        WHERE nationality_id = ?
        ORDER BY tier ASC, name ASC
      `,
      )
      .all(nationalityId) as { id: string; name: string; tier: number }[];
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
