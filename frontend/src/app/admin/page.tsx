"use client";

import { useState, useEffect } from "react";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  generateTeamPreviewAction,
  saveTeamAction,
  getLeagueLimitAction,
  deleteAllTeamsAction,
} from "../actions/dbActions";
import { Team } from "../models";

export default function AdminPage() {
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<
    { id: string; name: string; tier: number }[]
  >([]);
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [leagueStatus, setLeagueStatus] = useState<{
    current: number;
    max: number;
    isFull: boolean;
  } | null>(null);

  // Preview & UI State
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Initial Load: Nations
  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  // Effect: Fetch leagues when nation changes
  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then((data) => {
        setLeagues(data);
        setSelectedLeague("");
        setLeagueStatus(null);
        setPreviewTeam(null);
      });
    }
  }, [selectedNation]);

  // Effect: Fetch capacity when league changes
  useEffect(() => {
    if (selectedLeague) {
      getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      setPreviewTeam(null);
    }
  }, [selectedLeague]);

  const handleGenerate = async () => {
    if (!selectedLeague || leagueStatus?.isFull) return;
    setIsPending(true);
    setMessage(null);
    try {
      const result = await generateTeamPreviewAction(
        selectedLeague,
        selectedNation,
      );
      if (result.success && result.team) {
        setPreviewTeam(result.team);
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Generation failed",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleSave = async () => {
    if (!previewTeam) return;
    setIsPending(true);
    try {
      const result = await saveTeamAction(previewTeam);
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Team saved!" });
        setPreviewTeam(null);
        getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      } else {
        setMessage({ type: "error", text: result.error ?? "Save failed" });
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleWipe = async () => {
    if (confirm("DANGER: Delete ALL teams and players permanently?")) {
      const result = await deleteAllTeamsAction();
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message ?? "Database cleared",
        });
        setPreviewTeam(null);
        if (selectedLeague)
          getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* MAIN CONTROLS */}
        <div className="flex-1 space-y-8">
          <header>
            <h1 className="text-4xl font-black italic text-teal-500 tracking-tighter uppercase">
              Admin Portal
            </h1>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase mt-1">
              League & Team Management
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Nationality
              </label>
              <select
                value={selectedNation}
                onChange={(e) => setSelectedNation(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition"
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
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Competition
              </label>
              <select
                disabled={!selectedNation}
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition disabled:opacity-20"
              >
                <option value="">Select League</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (T{l.tier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-xs font-bold border animate-in fade-in zoom-in-95 ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* GENERATION ACTION */}
          {!previewTeam && (
            <div className="space-y-4">
              {leagueStatus?.isFull && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  League capacity reached
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!selectedLeague || isPending || leagueStatus?.isFull}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-600 p-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98]"
              >
                {isPending ? "Generating..." : "Generate Draft Team"}
              </button>
            </div>
          )}

          {/* APPROVAL PREVIEW */}
          {previewTeam && (
            <div className="bg-gray-900 border border-teal-500/30 p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase">
                    {previewTeam.name}
                  </h2>
                  <p className="text-teal-500 text-[10px] font-bold tracking-[0.3em] uppercase">
                    Draft Strategy Created
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] uppercase font-bold">
                    Generated ELO
                  </p>
                  <p className="text-3xl font-black text-white">
                    {previewTeam.elo_rating}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-white/5">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                      Philosophy
                    </p>
                    <p className="text-lg font-black text-gray-200 italic">
                      {previewTeam.tactics.style}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                      Formation
                    </p>
                    <p className="text-lg font-black text-gray-200">
                      {previewTeam.tactics.formation}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500 tracking-widest">
                      <span>Width</span>
                      <span>{previewTeam.tactics.width}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${previewTeam.tactics.width}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500 tracking-widest">
                      <span>Depth</span>
                      <span>{previewTeam.tactics.depth}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${previewTeam.tactics.depth}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] mt-2">
                    <p>
                      <span className="text-gray-600 block uppercase font-bold mb-0.5">
                        Build Up
                      </span>
                      {previewTeam.tactics.buildUp}
                    </p>
                    <p>
                      <span className="text-gray-600 block uppercase font-bold mb-0.5">
                        Creation
                      </span>
                      {previewTeam.tactics.chanceCreation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 bg-green-600 hover:bg-green-500 p-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Confirm & Save
                </button>
                <button
                  onClick={() => setPreviewTeam(null)}
                  disabled={isPending}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 p-4 rounded-xl font-black uppercase tracking-widest text-xs transition"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR STATS */}
        <aside className="w-full md:w-72 space-y-4">
          <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl sticky top-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">
              Competition Status
            </h3>

            {leagueStatus ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">
                    Teams Enrolled
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-black tracking-tighter ${leagueStatus.isFull ? "text-red-500" : "text-teal-500"}`}
                    >
                      {leagueStatus.current}
                    </span>
                    <span className="text-gray-700 font-bold">
                      / {leagueStatus.max}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Capacity</span>
                    <span>
                      {Math.round(
                        (leagueStatus.current / leagueStatus.max) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${leagueStatus.isFull ? "bg-red-500" : "bg-teal-500"}`}
                      style={{
                        width: `${(leagueStatus.current / leagueStatus.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">
                Select a league to view stats
              </div>
            )}

            <button
              onClick={handleWipe}
              className="w-full mt-12 pt-6 border-t border-white/5 text-[9px] font-black text-red-900 hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              Wipe All Teams
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
