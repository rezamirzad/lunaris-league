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
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);

  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedSeason, setSelectedSeason] = useState(""); // Initialize empty

  const [leagueTable, setLeagueTable] = useState<LeagueTableEntry[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>(null);

  const selectedLeagueName =
    leagues.find((l) => l.id === selectedLeague)?.name || "Unknown League";

  const formatSeasonDisplay = (sId: string) => {
    if (!sId || sId.length < 6) return sId;
    return `20${sId.slice(2, 4)} - ${sId.slice(4, 6)}`;
  };
  const displaySeason = formatSeasonDisplay(selectedSeason);

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

  useEffect(() => {
    getNationalitiesAction().then(setNations);
    // Fetch available seasons on mount
    getSeasonsAction().then((data) => {
      setSeasons(data);
      if (data.length > 0) setSelectedSeason(data[0]); // Default to latest
    });
  }, []);

  const handleFetchTable = async () => {
    if (!selectedLeague || !selectedSeason) return;
    const [tableData, statsData] = await Promise.all([
      getLeagueTableAction(selectedLeague, selectedSeason),
      getSeasonStatsAction(selectedLeague, selectedSeason),
    ]);
    setLeagueTable(tableData);
    setSeasonStats(statsData);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="border-b border-gray-800 bg-gray-900/20 sticky top-0 z-[100] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo Section */}
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-teal-500 italic">
              LUNARIS LEAGUE
            </h1>
          </div>

          <div className="flex gap-4 items-center">
            {/* Season Selector */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-teal-500 transition"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {formatSeasonDisplay(s)}
                </option>
              ))}
            </select>

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
              disabled={!selectedLeague || !selectedSeason}
              className="bg-teal-600 hover:bg-teal-500 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition"
            >
              Load
            </button>

            <div className="w-px h-6 bg-gray-800 mx-2" />

            {/* MATCH CENTER LINK */}
            <Link
              href="/match-center"
              className="text-[10px] font-black text-teal-500 hover:text-white uppercase tracking-widest transition border border-teal-500/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/10"
            >
              Match Center
            </Link>

            {/* NEW ADMIN BUTTON */}
            <div className="w-px h-6 bg-gray-800 mx-2" />
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
              seasonId={selectedSeason} // Now using the state
              title={`${selectedLeagueName} (${selectedNation}, ${displaySeason}) Standings`}
            />
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col items-center justify-center text-gray-700 uppercase font-black tracking-[0.5em] text-[10px]">
            Select criteria to begin analysis
          </div>
        )}
      </main>
    </div>
  );
}
