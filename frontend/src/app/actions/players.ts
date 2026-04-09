"use server";

import Database from "better-sqlite3";
import { PlayerGenerator } from "@/lib/generators/playergenerator";
import { revalidatePath } from "next/cache";

export async function generateRandomPlayer() {
  const db = new Database("lunaris-league.db");

  // 1. Generate the player object
  const newPlayer = PlayerGenerator.generate("ST", "NOR", "t_6be93611", 820);

  // 2. Prepare the data for SQLite (JSON objects must be strings)
  const stmt = db.prepare(`
        INSERT INTO players (id, teamId, name, position, ovr, currentElo, age, attributes, history, nationality_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

  stmt.run(
    newPlayer.id,
    newPlayer.id === "p_fa344c7d" ? "man_city" : newPlayer.teamId, // Example logic
    newPlayer.name,
    newPlayer.position,
    newPlayer.ovr,
    newPlayer.currentElo,
    newPlayer.age,
    JSON.stringify(newPlayer.attributes),
    JSON.stringify(newPlayer.history),
    "NOR", // Haaland/Norway example
  );

  db.close();

  // 3. Refresh the page to show the new player
  revalidatePath("/");
}
