"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

  // Define the active season context
  const currentSeason = "s_2526";

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
      getLeagueTableAction(selectedLeague, currentSeason),
      getSeasonStatsAction(selectedLeague, currentSeason),
    ]);
    setLeagueTable(tableData);
    setSeasonStats(statsData);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="border-b border-gray-800 bg-gray-900/20 sticky top-0 z-[100] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-teal-500 italic">
              LUNARIS LEAGUE
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
              Global Database v1.0
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Nation Selector */}
            <select
              value={selectedNation}
              onChange={(e) => setSelectedNation(e.target.value)}
              className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-teal-500 transition"
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
              className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-teal-500 transition disabled:opacity-30"
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
              disabled={!selectedLeague}
              className="bg-teal-600 hover:bg-teal-500 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition disabled:bg-gray-800"
            >
              Load
            </button>

            <div className="w-px h-6 bg-gray-800 mx-2" />

            {/* Admin Access */}
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
          <div className="animate-in fade-in duration-700">
            <LeagueTableCard
              data={leagueTable}
              seasonStats={seasonStats}
              seasonId={currentSeason} // Dynamically passed to handle team match clicks
              title={`${selectedNation} Standings`}
            />
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col items-center justify-center text-gray-700 uppercase font-black tracking-[0.5em] text-[10px]">
            <div className="w-12 h-1 bg-gray-800 mb-4 rounded-full" />
            Select competition to begin analysis
          </div>
        )}
      </main>
    </div>
  );
}
