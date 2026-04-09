"use client";

import { useState, useEffect } from "react";
import {
  checkDb,
  createRegenAction,
  createTeamAction,
  getSquadAction,
  getTeamAndPlayersAction,
  getNationalitiesAction,
  getLeaguesByNationAction,
  getTeamsByLeagueAction,
  getTeamLookupAction,
} from "./actions/dbActions";
import { PlayerCard } from "./components/PlayerCard";
import { Player, Team } from "./models";
import { FIFA_NATIONS } from "@/lib/dictionaries/nationNameData";

export default function Home() {
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Cascading dropdown lists
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  // Selected values for cascading dropdowns
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamLookup, setTeamLookup] = useState<
    Record<string, { name: string; nation: string }>
  >({});

  // Player nationality state
  const [playerNation, setPlayerNation] = useState("ENG");

  useEffect(() => {
    refreshSquad();
    loadNations();
  }, []);

  // Sync player nation to team nation choice
  useEffect(() => {
    if (selectedNation) {
      setPlayerNation(selectedNation);
    }
  }, [selectedNation]);

  const loadNations = async () => {
    const data = await getNationalitiesAction();
    setNations(data);
  };

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then((data) => {
        setLeagues(data);
        setSelectedLeague("");
        setTeams([]);
        setSelectedTeamId("");
      });
    } else {
      setLeagues([]);
    }
  }, [selectedNation]);

  useEffect(() => {
    if (selectedLeague) {
      getTeamsByLeagueAction(selectedLeague).then((data) => {
        setTeams(data);
        setSelectedTeamId("");
      });
    } else {
      setTeams([]);
    }
  }, [selectedLeague]);

  const refreshSquad = async () => {
    try {
      // Execute both, but handle them safely
      const playerData = await getSquadAction();
      const lookupData = await getTeamLookupAction();

      console.log("Players fetched:", playerData?.length); // Debug log

      setSquad(playerData ?? []);
      setTeamLookup(lookupData || {});
    } catch (error) {
      console.error("Failed to refresh squad:", error);
      setDbStatus("Database connection failed. Please check if the DB exists.");
    }
  };

  const handleViewTeam = async (teamId: string) => {
    setDbStatus("Loading Team...");
    const result = await getTeamAndPlayersAction(teamId);

    if (result.success) {
      setSelectedTeam(result.team as Team);
      setSquad(result.players ?? []);
      setDbStatus(null);
    } else {
      setDbStatus("Error loading team");
    }
  };

  const handleGenerate = async () => {
    if (!playerNation || !selectedTeamId) return;
    setDbStatus("Generating...");
    const result = await createRegenAction(playerNation, selectedTeamId);

    if (result.success) {
      setDbStatus(`Generated: ${result.player?.name}`);
      refreshSquad();
    }
  };

  const handleGenerateTeam = async () => {
    setDbStatus("Generating Team...");
    const result = await createTeamAction();
    if (result.success) {
      setDbStatus(`Generated Team: ${result.team?.name}`);
      loadNations();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-black text-white font-sans">
      <main className="w-full max-w-6xl px-10 text-center">
        <h1 className="text-6xl font-bold mb-10 tracking-tighter text-teal-500">
          Lunaris League
        </h1>

        {/* CASCADING GENERATION CONTROLS */}
        <div className="flex flex-col gap-6 mb-10 bg-gray-900/40 p-8 rounded-3xl border border-gray-800 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* 1. Team Nation */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                Team Nation
              </label>
              <select
                value={selectedNation}
                onChange={(e) => setSelectedNation(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition"
              >
                <option value="">Select Nation</option>
                {nations.map((n: string) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. League Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                League
              </label>
              <select
                disabled={!selectedNation}
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition disabled:opacity-30"
              >
                <option value="">Select League</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Target Team */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                Target Team
              </label>
              <select
                disabled={!selectedLeague}
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 outline-none transition disabled:opacity-30"
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Player Nationality */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">
                Player Nationality
              </label>
              <select
                value={playerNation}
                onChange={(e) => setPlayerNation(e.target.value)}
                className="w-full bg-black border border-teal-900/50 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none transition shadow-[0_0_15px_rgba(20,184,166,0.1)]"
              >
                {FIFA_NATIONS.map((code: string) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>{" "}
          {/* <--- THIS WAS MISSING IN YOUR PREVIOUS SNIPPET */}
          <div className="flex justify-center gap-4 mt-2">
            <button
              disabled={!selectedTeamId}
              onClick={handleGenerate}
              className="bg-teal-600 hover:bg-teal-500 px-10 py-3 rounded-full font-bold transition shadow-lg shadow-teal-900/20 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              + Generate Player
            </button>
            <button
              onClick={handleGenerateTeam}
              className="bg-blue-600 hover:bg-blue-500 px-10 py-3 rounded-full font-bold transition shadow-lg shadow-blue-900/20"
            >
              + Generate New Team
            </button>
          </div>
        </div>

        {/* STATUS & UTILS */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <button
            onClick={async () => {
              const res = await checkDb();
              setDbStatus(`DB Online: ${res.count} players found.`);
            }}
            className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-4 transition"
          >
            Run Database Diagnostic
          </button>
          {dbStatus && (
            <p className="text-teal-400 font-mono text-sm animate-pulse tracking-tight">
              {dbStatus}
            </p>
          )}
        </div>

        {/* TEAM CARD DISPLAY */}
        {selectedTeam && (
          <div className="mb-10 p-8 bg-gray-900 border-l-4 border-teal-500 rounded-2xl text-left animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                  {selectedTeam.name}
                </h2>
                <div className="flex gap-3 mt-2">
                  <span className="bg-teal-900/50 text-teal-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-teal-800">
                    {selectedTeam.tactics.formation}
                  </span>
                  <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-gray-700">
                    {selectedTeam.tactics.style || "Standard"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  refreshSquad();
                }}
                className="bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* PLAYER SQUAD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
          {squad.map((player) => (
            <PlayerCard
              player={player}
              key={player.id}
              teamDetails={teamLookup[player.teamId]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
