"use client";

import { useState, useEffect } from "react";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  generateTeamPreviewAction,
  saveTeamAction,
  getLeagueLimitAction,
  deleteAllTeamsAction,
} from "./actions/dbActions";
import { Team } from "./models";

export default function AdminPage() {
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [leagueStatus, setLeagueStatus] = useState<{
    current: number;
    max: number;
    isFull: boolean;
  } | null>(null);
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then(setLeagues);
      setSelectedLeague("");
      setLeagueStatus(null);
    }
  }, [selectedNation]);

  useEffect(() => {
    if (selectedLeague) {
      getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
    }
  }, [selectedLeague]);

  const handleGenerate = async () => {
    setIsPending(true);
    const result = await generateTeamPreviewAction(
      selectedLeague,
      selectedNation,
    );
    if (result.success) setPreviewTeam(result.team!);
    setIsPending(false);
  };

  const handleSave = async () => {
    setIsPending(true);
    const result = await saveTeamAction(previewTeam!);
    if (result.success) {
      setPreviewTeam(null);
      getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      setMessage({ type: "success", text: result.message! });
    }
    setIsPending(false);
  };

  const handleWipe = async () => {
    if (confirm("Delete ALL teams and players permanently?")) {
      const result = await deleteAllTeamsAction();
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message ?? "Database wiped",
        });
        if (selectedLeague)
          getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-black italic text-teal-500 uppercase tracking-tighter">
            Admin Portal
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em]">
            Tier-Based Team Architect
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <select
            value={selectedNation}
            onChange={(e) => setSelectedNation(e.target.value)}
            className="bg-gray-900 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-teal-500"
          >
            <option value="">Select Nation</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            disabled={!selectedNation}
            className="bg-gray-900 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-teal-500 disabled:opacity-30"
          >
            <option value="">Select League</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold border ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}
          >
            {message.text}
          </div>
        )}

        {!previewTeam ? (
          <button
            onClick={handleGenerate}
            disabled={!selectedLeague || leagueStatus?.isFull || isPending}
            className="w-full bg-teal-600 hover:bg-teal-500 p-4 rounded-xl font-black uppercase tracking-widest text-xs transition disabled:bg-gray-800 disabled:text-gray-600"
          >
            {leagueStatus?.isFull
              ? "League Full"
              : isPending
                ? "Generating..."
                : "Generate Random Team"}
          </button>
        ) : (
          <div className="bg-gray-900 border border-teal-500/30 p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
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
                  Base ELO
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

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 p-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-green-500 active:scale-95"
              >
                Approve & Save
              </button>
              <button
                onClick={() => setPreviewTeam(null)}
                className="flex-1 bg-white/5 p-4 rounded-xl font-black text-[11px] uppercase text-gray-400 tracking-widest hover:bg-white/10 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="w-full md:w-72 space-y-4">
        <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl sticky top-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">
            League Status
          </h3>
          {leagueStatus ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">
                  Teams Enrolled
                </p>
                <p
                  className={`text-4xl font-black ${leagueStatus.isFull ? "text-red-500" : "text-teal-500"}`}
                >
                  {leagueStatus.current}{" "}
                  <span className="text-sm text-gray-700">
                    / {leagueStatus.max}
                  </span>
                </p>
              </div>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-700 ${leagueStatus.isFull ? "bg-red-500" : "bg-teal-500"}`}
                  style={{
                    width: `${(leagueStatus.current / leagueStatus.max) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-gray-700 italic">
              No league selected
            </p>
          )}
          <button
            onClick={handleWipe}
            className="w-full mt-12 pt-6 border-t border-white/5 text-[9px] font-black text-red-900 hover:text-red-500 transition uppercase"
          >
            Wipe All Teams
          </button>
        </div>
      </aside>
    </div>
  );
}
