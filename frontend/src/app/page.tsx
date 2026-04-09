"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  getLeagueTableAction,
  getSeasonStatsAction,
  getSeasonsAction,
} from "./actions/dbActions";
import { LeagueTableEntry } from "./models";
import { LeagueTableCard } from "./components/LeagueTableCard";

export default function Home() {
  const [leagueTable, setLeagueTable] = useState<LeagueTableEntry[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>(null);
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [seasons, setSeasons] = useState<
    { id: string; name: string; is_active: number }[]
  >([]);

  // Selection States
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initial Data Load (Nations & Seasons)
  useEffect(() => {
    getNationalitiesAction().then(setNations);

    getSeasonsAction().then((data) => {
      setSeasons(data);
      // Automatically select the active season (is_active: 1)
      const active = data.find((s) => s.is_active === 1);
      if (active) setSelectedSeason(active.id);
      else if (data.length > 0) setSelectedSeason(data[0].id);
    });
  }, []);

  // Cascading League Selection
  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then((data) => {
        setLeagues(data);
        setSelectedLeague(""); // Reset league when nation changes
        setLeagueTable([]);
        setSeasonStats(null);
      });
    }
  }, [selectedNation]);

  const handleFetchTable = async () => {
    if (!selectedLeague || !selectedSeason) return;

    setIsLoading(true);
    try {
      const [tableData, statsData] = await Promise.all([
        getLeagueTableAction(selectedLeague, selectedSeason),
        getSeasonStatsAction(selectedLeague, selectedSeason),
      ]);
      setLeagueTable(tableData);
      setSeasonStats(statsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-teal-500/30">
      {/* NAVBAR */}
      <header className="border-b border-white/5 bg-gray-900/20 sticky top-0 z-[100] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter text-teal-500 italic">
              LUNARIS LEAGUE
            </h1>
          </div>

          <div className="flex gap-3 items-center">
            {/* Nation Selector */}
            <select
              value={selectedNation}
              onChange={(e) => setSelectedNation(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 focus:border-teal-500 outline-none transition"
            >
              <option value="">Nation</option>
              {nations.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* League Selector */}
            <select
              disabled={!selectedNation}
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 focus:border-teal-500 outline-none transition disabled:opacity-20"
            >
              <option value="">League</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Season Selector */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 focus:border-teal-500 outline-none transition"
            >
              <option value="">Season</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleFetchTable}
              disabled={!selectedLeague || isLoading}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition shadow-lg shadow-teal-900/20 active:scale-95"
            >
              {isLoading ? "Loading..." : "Load Data"}
            </button>

            <div className="w-px h-6 bg-white/10 mx-2" />

            <Link
              href="/admin"
              className="text-[10px] font-black text-gray-500 hover:text-teal-400 uppercase tracking-[0.2em] transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-8">
        {leagueTable.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LeagueTableCard
              data={leagueTable}
              seasonStats={seasonStats}
              title={`${leagues.find((l) => l.id === selectedLeague)?.name} Standings`}
            />
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-2 border-white/5 rounded-full flex items-center justify-center">
              <span className="text-white/20 font-black text-xl italic">!</span>
            </div>
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
              Initialize Dashboard Parameters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
