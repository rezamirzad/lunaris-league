"use server";

import Database from "better-sqlite3";
import path from "path";
import { PlayerGenerator } from "@/lib/generators/PlayerGenerator";
import { TeamGenerator } from "@/lib/generators/TeamGenerator";
import { Player, Team, Match, LeagueTableEntry } from "@/app/models";

const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");

/**
 * Utility for the UI to check connection and counts
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
 * Fetches all players (unfiltered)
 */
export async function getPlayers(): Promise<Player[]> {
  const db = new Database(dbPath);
  try {
    const rows = db.prepare("SELECT * FROM players").all() as any[];
    return rows.map((row) => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      history: JSON.parse(row.history),
    }));
  } finally {
    db.close();
  }
}

/**
 * Fetches all players for the main squad view
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
  } catch (error) {
    return [];
  } finally {
    db.close();
  }
}

/**
 * CASCADING DROPDOWN LOGIC: Step 1 - Get Nationalities
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

/**
 * CASCADING DROPDOWN: Step 2 - Get Leagues for a Nation
 * Joins with the competitions table to get the real name
 */
export async function getLeaguesByNationAction(nationalityId: string) {
  const db = new Database(dbPath);
  try {
    // LEFT JOIN ensures we see the league even if the competition table is missing the ID
    const leagues = db
      .prepare(
        `
      SELECT DISTINCT 
        t.league_id as id, 
        c.name 
      FROM teams t
      LEFT JOIN competitions c ON t.league_id = c.id
      WHERE t.nationality_id = ?
      ORDER BY c.name
    `,
      )
      .all(nationalityId) as { id: string; name: string | null }[];

    // If name is null from the JOIN, fallback to the ID so the dropdown isn't empty
    return leagues.map((l) => ({
      id: l.id,
      name: l.name || `Unknown League (${l.id})`,
    }));
  } catch (e) {
    console.error("❌ Error fetching leagues:", e);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Fetches a simple map of team details for UI display
 */
export async function getTeamLookupAction() {
  const db = new Database(dbPath);
  try {
    const teams = db
      .prepare("SELECT id, name, nationality_id FROM teams")
      .all() as { id: string; name: string; nationality_id: string }[];

    // Map array to a dictionary for fast lookup: { "t_123": { name: "Man City", nation: "ENG" } }
    const lookup: Record<string, { name: string; nation: string }> = {};
    teams.forEach((t) => {
      lookup[t.id] = { name: t.name, nation: t.nationality_id };
    });

    return lookup;
  } catch (e) {
    console.error("❌ Lookup Error:", e);
    return {};
  } finally {
    db.close();
  }
}

/**
 * CASCADING DROPDOWN LOGIC: Step 3 - Get Teams for a League
 */
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

/**
 * Creates a specific player based on user selection
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

    const stmt = db.prepare(`
      INSERT INTO players (id, teamId, name, position, ovr, currentElo, age, attributes, history, nationality_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
  } catch (e) {
    console.error(e);
    return { success: false };
  } finally {
    db.close();
  }
}

/**
 * Generates and saves a new random team
 */
export async function createTeamAction() {
  const db = new Database(dbPath);
  try {
    const nations = ["ENG", "ESP", "NOR", "IRN"];
    const randomNation = nations[Math.floor(Math.random() * nations.length)];

    const newTeam = TeamGenerator.generate("l_464dfb25", randomNation);

    const existing = db
      .prepare("SELECT id FROM teams WHERE name = ?")
      .get(newTeam.name);
    if (existing) {
      return { success: false, error: "Team name already exists" };
    }

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

    return { success: true, team: newTeam };
  } catch (e) {
    console.error("❌ Team Generation Error:", e);
    return { success: false, error: "Failed to generate team" };
  } finally {
    db.close();
  }
}

/**
 * Fetches a team card and filtered squad
 */
export async function getTeamAndPlayersAction(teamId: string) {
  const db = new Database(dbPath);
  try {
    const team = db
      .prepare("SELECT * FROM teams WHERE id = ?")
      .get(teamId) as any;

    if (!team) return { success: false, error: "Team not found" };

    const players = db
      .prepare("SELECT * FROM players WHERE teamId = ?")
      .all(teamId) as any[];

    return {
      success: true,
      team: {
        ...team,
        tactics: JSON.parse(team.tactics_json || team.tactics),
      } as Team,
      players: players.map((p) => ({
        ...p,
        attributes: JSON.parse(p.attributes),
        history: JSON.parse(p.history),
      })) as Player[],
    };
  } catch (e) {
    console.error("❌ Fetch Team Error:", e);
    return { success: false, error: "Database error" };
  } finally {
    db.close();
  }
}

export async function saveMatchResultAction(
  match: Match,
  teamStats: any,
  playerStats: {
    playerId: string;
    goals: number;
    assists: number;
    rating: number;
  }[],
) {
  const db = new Database(dbPath);
  const transaction = db.transaction(() => {
    // 1. Insert Match
    db.prepare(
      `INSERT INTO matches (id, competition_id, matchweek, home_team_id, away_team_id, home_goals, away_goals) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      match.id,
      match.competitionId,
      match.matchweek,
      match.homeTeamId,
      match.awayTeamId,
      match.homeGoals,
      match.awayGoals,
    );

    // 2. Insert Player Stats (Loop through players who participated)
    const playerStmt = db.prepare(
      `INSERT INTO match_player_stats (match_id, player_id, goals, assists, rating) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const p of playerStats) {
      playerStmt.run(match.id, p.playerId, p.goals, p.assists, p.rating);
    }
  });

  try {
    transaction();
    return { success: true };
  } catch (e) {
    console.error("Save Match Error:", e);
    return { success: false };
  } finally {
    db.close();
  }
}

export async function getLeagueTableAction(
  competitionId: string,
  seasonId: string, // New parameter
): Promise<LeagueTableEntry[]> {
  const db = new Database(dbPath);
  try {
    const query = `
      SELECT 
        t.id as teamId,
        t.name as teamName,
        COUNT(m.id) as played,
        SUM(CASE 
          WHEN (m.home_team_id = t.id AND m.home_goals > m.away_goals) OR 
               (m.away_team_id = t.id AND m.away_goals > m.home_goals) THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) as drawn,
        SUM(CASE 
          WHEN (m.home_team_id = t.id AND m.home_goals < m.away_goals) OR 
               (m.away_team_id = t.id AND m.away_goals < m.home_goals) THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.home_goals ELSE m.away_goals END) as gf,
        SUM(CASE WHEN m.home_team_id = t.id THEN m.away_goals ELSE m.home_goals END) as ga,
        (SUM(CASE WHEN m.home_team_id = t.id THEN m.home_goals ELSE m.away_goals END) - 
         SUM(CASE WHEN m.home_team_id = t.id THEN m.away_goals ELSE m.home_goals END)) as gd,
        SUM(CASE 
            WHEN (m.home_team_id = t.id AND m.home_goals > m.away_goals) OR 
                 (m.away_team_id = t.id AND m.away_goals > m.home_goals) THEN 3
            WHEN m.home_goals = m.away_goals THEN 1
            ELSE 0 
        END) as points
      FROM teams t
      JOIN matches m ON t.id = m.home_team_id OR t.id = m.away_team_id
      WHERE m.competition_id = ? AND m.season_id = ?
      GROUP BY t.id
      ORDER BY points DESC, gd DESC, gf DESC
    `;

    // Pass both competitionId and seasonId to the query
    return db.prepare(query).all(competitionId, seasonId) as LeagueTableEntry[];
  } finally {
    db.close();
  }
}
