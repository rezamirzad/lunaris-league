"use server"; // This is required for Server Actions

import Database from "better-sqlite3";
import path from "path";
import { PlayerGenerator } from "@/lib/generators/playergenerator";
import { Player } from "@/app/models";

const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");

export async function checkDb() {
  // We use path.join to ensure we find the DB in your root folder
  try {
    const db = new Database(dbPath);
    const result = db
      .prepare("SELECT COUNT(*) as count FROM players")
      .get() as { count: number };

    console.log(
      `✅ Connection Successful! Current Player Count: ${result.count}`,
    );
    db.close();

    return { success: true, count: result.count };
  } catch (error) {
    console.error("❌ Database Error:", error);
    return { success: false, error: "Could not connect to database" };
  }
}

export async function getPlayers() {
  const dbPath = path.join(process.cwd(), "..", "lunaris-league.db");
  const db = new Database(dbPath);

  const rows = db.prepare("SELECT * FROM players").all() as any[];

  const players = rows.map((row) => ({
    ...row,
    attributes: JSON.parse(row.attributes),
    history: JSON.parse(row.history),
  }));

  db.close();
  return players;
}

export async function createRegenAction() {
  const db = new Database(dbPath);
  try {
    // 1. List of available nations in your DB
    const nations = ["NOR", "ESP", "IRN"];
    const randomNation = nations[Math.floor(Math.random() * nations.length)];

    // 2. List of possible positions
    const positions: Player["position"][] = [
      "ST",
      "CM",
      "CB",
      "GK",
      "LW",
      "RW",
    ];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];

    // 3. Generate the player with the random nation
    const newPlayer = PlayerGenerator.generate(
      randomPos,
      randomNation,
      "t_6be93611",
      Math.floor(Math.random() * (850 - 700 + 1)) + 700, // Random OVR between 70-85
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
      newPlayer.nationality_id, // This is now random!
    );

    return { success: true, player: newPlayer };
  } catch (e) {
    console.error(e);
    return { success: false };
  } finally {
    db.close();
  }
}

export async function getSquadAction() {
  const db = new Database(dbPath);
  try {
    const players = db.prepare("SELECT * FROM players").all() as any[];
    // Parse JSON strings back into objects for the frontend
    return players.map((p) => ({
      ...p,
      attributes: JSON.parse(p.attributes),
      history: JSON.parse(p.history),
    }));
  } finally {
    db.close();
  }
}
