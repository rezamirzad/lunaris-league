"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // Ensure Link is imported
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  getLeagueTableAction,
  getSeasonStatsAction,
} from "./actions/dbActions";
import { LeagueTableEntry } from "./models";
import { LeagueTableCard } from "./components/LeagueTableCard";

export default function Home() {
  const [leagueTable, setLeagueTable] = useState<LeagueTableEntry[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>(null);
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then((data) => {
        setLeagues(data);
        setSelectedLeague("");
        setLeagueTable([]);
        setSeasonStats(null);
      });
    }
  }, [selectedNation]);

  const handleFetchTable = async () => {
    if (!selectedLeague) return;
    const [tableData, statsData] = await Promise.all([
      getLeagueTableAction(selectedLeague, "s_2526"),
      getSeasonStatsAction(selectedLeague, "s_2526"),
    ]);
    setLeagueTable(tableData);
    setSeasonStats(statsData);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="border-b border-gray-800 bg-gray-900/20 sticky top-0 z-[100] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter text-teal-500 italic">
            LUNARIS LEAGUE
          </h1>

          <div className="flex gap-4 items-center">
            {/* ... selectors remain same ... */}
            <select
              value={selectedNation}
              onChange={(e) => setSelectedNation(e.target.value)}
              className="bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs"
            >
              <option value="">Nation</option>
              {nations.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              disabled={!selectedNation}
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs"
            >
              <option value="">League</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleFetchTable}
              className="bg-teal-600 px-4 py-1.5 rounded-lg text-xs font-bold"
            >
              Load
            </button>

            <div className="w-px h-6 bg-gray-800 mx-2" />

            {/* CRITICAL: Link to Admin */}
            <Link
              href="/admin"
              className="text-[10px] font-black text-gray-500 hover:text-teal-400 uppercase tracking-widest transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {leagueTable.length > 0 && seasonStats ? (
          <LeagueTableCard
            data={leagueTable}
            seasonStats={seasonStats}
            title="League Standings"
          />
        ) : (
          <div className="h-[70vh] flex flex-col items-center justify-center text-gray-700 uppercase font-bold tracking-widest text-xs">
            Select competition to begin
          </div>
        )}
      </main>
    </div>
  );
}
