"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  createTeamAction,
} from "../actions/dbActions";

export default function AdminPage() {
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);

  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [creationLog, setCreationLog] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then(setLeagues);
      setSelectedLeague(""); // Reset league when nation changes
    }
  }, [selectedNation]);

  const handleCreateTeam = async () => {
    if (!selectedNation || !selectedLeague) return;

    setIsGenerating(true);
    const result = await createTeamAction(selectedLeague, selectedNation);
    setIsGenerating(false);

    if (result.success) {
      // Add to the local creation log for immediate feedback
      setCreationLog((prev) => [result.details, ...prev]);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link
              href="/"
              className="text-teal-500 text-xs font-black uppercase tracking-widest hover:text-white transition"
            >
              ← Dashboard
            </Link>
            <h1 className="text-4xl font-black italic tracking-tighter mt-2">
              WORLD BUILDER
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1 & 2: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-gray-900/40 p-8 rounded-3xl border border-white/5">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <span className="text-teal-500 text-2xl">#</span> Expansion
                Control
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Target Nation
                  </label>
                  <select
                    value={selectedNation}
                    onChange={(e) => setSelectedNation(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition"
                  >
                    <option value="">Select Nation</option>
                    {nations.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Target League
                  </label>
                  <select
                    disabled={!selectedNation}
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none disabled:opacity-20"
                  >
                    <option value="">Select League</option>
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateTeam}
                disabled={!selectedLeague || isGenerating}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-500 transition disabled:opacity-10"
              >
                {isGenerating
                  ? "Executing Expansion..."
                  : "Generate New Franchise"}
              </button>
            </section>
          </div>

          {/* COLUMN 3: Live Feedback Log */}
          <aside className="bg-gray-900/20 p-6 rounded-3xl border border-white/5 h-fit">
            <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-6">
              Creation Log
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {creationLog.length === 0 && (
                <p className="text-gray-600 text-[11px] italic">
                  No entities created in this session.
                </p>
              )}
              {creationLog.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 p-4 rounded-xl border-l-2 border-teal-500 animate-in slide-in-from-right-4 duration-300"
                >
                  <p className="text-xs font-bold text-white uppercase">
                    {item.name}
                  </p>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-gray-500 font-mono">
                      {item.nation} / {item.league}
                    </span>
                    <span className="text-[9px] text-teal-500 font-mono">
                      Rating: {item.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
