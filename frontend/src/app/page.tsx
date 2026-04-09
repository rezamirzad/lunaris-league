"use client";

import { useState, useEffect } from "react";
import {
  checkDb,
  createRegenAction,
  getSquadAction,
} from "./actions/dbActions";
import { PlayerCard } from "./components/PlayerCard";
import { Player } from "./models";

export default function Home() {
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);

  useEffect(() => {
    refreshSquad();
  }, []);

  const refreshSquad = async () => {
    const data = await getSquadAction();
    setSquad(data);
  };

  const handleGenerate = async () => {
    setDbStatus("Generating...");
    const result = await createRegenAction();
    if (result.success) {
      setDbStatus(`Generated: ${result.player?.name}`);
      refreshSquad();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-black text-white">
      <main className="w-full max-w-4xl px-10 text-center">
        <h1 className="text-6xl font-bold mb-10 tracking-tighter">
          Lunaris League
        </h1>

        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={handleGenerate}
            className="bg-teal-600 hover:bg-teal-500 px-6 py-2 rounded-full font-bold transition shadow-lg shadow-teal-900/20"
          >
            + Generate Player
          </button>

          <button
            onClick={async () => {
              const res = await checkDb();
              setDbStatus(`Count: ${res.count}`);
            }}
            className="border border-gray-700 hover:bg-gray-800 px-6 py-2 rounded-full transition"
          >
            Check DB
          </button>
        </div>

        {dbStatus && (
          <p className="text-teal-400 mb-6 font-mono text-sm">{dbStatus}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {squad.map((player) => (
            <PlayerCard player={player} key={player.id} />
          ))}
        </div>
      </main>
    </div>
  );
}
