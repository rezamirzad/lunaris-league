"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  generateTeamPreviewAction,
  saveTeamAction,
  getLeagueLimitAction,
  deleteAllTeamsAction,
  getTeamsByLeagueAction,
  saveSquadAction,
  getTeamSquadSizeAction,
} from "../actions/dbActions";
import { PlayerGenerator } from "@/lib/generators/PlayerGenerator";
import { Team, Player, PlayerPosition } from "../models";
import Link from "next/link";

type SortKey = keyof Player | "pac" | "sho" | "pas" | "dri" | "def" | "phy";

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

  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);
  const [teamsInLeague, setTeamsInLeague] = useState<any[]>([]);

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [previewSquad, setPreviewSquad] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );

  const [sortKey, setSortKey] = useState<SortKey>("ovr");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentSquadSize, setCurrentSquadSize] = useState<number>(0);

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const togglePlayerSelection = (id: string) => {
    const newSelection = new Set(selectedPlayerIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedPlayerIds(newSelection);
  };

  const eloStats = useMemo(() => {
    if (teamsInLeague.length === 0) return null;
    const elos = teamsInLeague.map((t) => t.elo_rating);
    const min = Math.min(...elos);
    const max = Math.max(...elos);
    const avg = Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);

    let newAvg = avg;
    let diff = 0;
    if (previewTeam) {
      newAvg = Math.round(
        (elos.reduce((a, b) => a + b, 0) + previewTeam.elo_rating) /
          (elos.length + 1),
      );
      diff = newAvg - avg;
    }
    return { min, max, avg, newAvg, diff };
  }, [teamsInLeague, previewTeam]);

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then(setLeagues);
      setSelectedLeague("");
      setLeagueStatus(null);
      setPreviewSquad([]);
      setPreviewTeam(null);
    }
  }, [selectedNation]);

  useEffect(() => {
    if (selectedLeague) refreshLeagueData();
  }, [selectedLeague]);

  const refreshLeagueData = async () => {
    const [limit, teams] = await Promise.all([
      getLeagueLimitAction(selectedLeague),
      getTeamsByLeagueAction(selectedLeague),
    ]);
    setLeagueStatus(limit);
    setTeamsInLeague(teams);
  };

  useEffect(() => {
    if (selectedTeam) {
      getTeamSquadSizeAction(selectedTeam.id).then(setCurrentSquadSize);
    } else {
      setCurrentSquadSize(0);
    }
  }, [selectedTeam]);

  const handleGenerateTeam = async () => {
    setIsPending(true);
    const result = await generateTeamPreviewAction(
      selectedLeague,
      selectedNation,
    );
    if (result.success && result.team) setPreviewTeam(result.team);
    else setPreviewTeam(null);
    setIsPending(false);
  };

  const handleSaveTeam = async () => {
    if (!previewTeam) return;
    setIsPending(true);
    const result = await saveTeamAction(previewTeam);
    if (result.success) {
      setMessage({ type: "success", text: result.message ?? "Team saved!" });
      setPreviewTeam(null);
      refreshLeagueData();
    } else {
      setMessage({ type: "error", text: result.error ?? "Save failed" });
    }
    setIsPending(false);
  };

  const sortedSquad = useMemo(() => {
    return [...previewSquad].sort((a, b) => {
      let valA: any, valB: any;
      const attributeKeys = ["pac", "sho", "pas", "dri", "def", "phy"];
      if (attributeKeys.includes(sortKey as string)) {
        valA = (a as any).attributes?.[sortKey] ?? 0;
        valB = (b as any).attributes?.[sortKey] ?? 0;
      } else {
        valA = a[sortKey as keyof Player];
        valB = b[sortKey as keyof Player];
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [previewSquad, sortKey, sortOrder]);

  const nationalitySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    previewSquad.forEach((p) => {
      counts[p.nationality_id] = (counts[p.nationality_id] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [previewSquad]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const handleGenerateSquad = () => {
    if (!selectedTeam) return;
    if (currentSquadSize >= 35) {
      if (
        !confirm(
          `Warning: ${selectedTeam.name} already has ${currentSquadSize} players. Continue?`,
        )
      )
        return;
    }
    const leagueTier = leagues.find((l) => l.id === selectedLeague)?.tier ?? 4;
    const squad = PlayerGenerator.generateSquad(
      selectedTeam.id,
      selectedTeam.elo_rating,
      selectedTeam.nationality_id,
      leagueTier,
    );
    setPreviewSquad(squad);
    setSelectedPlayerIds(new Set(squad.map((p) => p.id)));
  };

  const handleReplacePlayer = (oldPlayer: Player) => {
    const leagueTier = leagues.find((l) => l.id === selectedLeague)?.tier ?? 4;
    const replacement = PlayerGenerator.generateSinglePlayer(
      selectedTeam.id,
      selectedTeam.elo_rating,
      selectedTeam.nationality_id,
      leagueTier,
      oldPlayer.position as PlayerPosition,
    );
    setPreviewSquad((prev) =>
      prev.map((p) => (p.id === oldPlayer.id ? replacement : p)),
    );
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(oldPlayer.id);
      next.add(replacement.id);
      return next;
    });
  };

  const handleSaveSquad = async () => {
    const playersToSave = previewSquad.filter((p) =>
      selectedPlayerIds.has(p.id),
    );
    if (playersToSave.length === 0) return;
    setIsPending(true);
    try {
      const result = await saveSquadAction(playersToSave);
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Squad saved!" });
        setPreviewSquad([]);
        setSelectedPlayerIds(new Set());
        getTeamSquadSizeAction(selectedTeam.id).then(setCurrentSquadSize);
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Connection error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-12">
      <header className="max-w-7xl mx-auto flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-teal-500 uppercase tracking-tighter">
            Admin Portal
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
            Squad & Database Architect
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/match-center"
            className="text-[10px] font-black text-gray-500 hover:text-teal-400 uppercase tracking-widest transition"
          >
            Match Center
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition"
          >
            <span className="text-teal-500">←</span> Return Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-12">
          {/* 1. SELECTORS */}
          <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-6 rounded-2xl border border-white/5 shadow-2xl">
            <select
              value={selectedNation}
              onChange={(e) => setSelectedNation(e.target.value)}
              className="bg-black border border-white/10 p-3 rounded-xl text-xs uppercase font-bold outline-none focus:border-teal-500 transition cursor-pointer"
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
              className="bg-black border border-white/10 p-3 rounded-xl text-xs uppercase font-bold outline-none focus:border-teal-500 disabled:opacity-20 transition cursor-pointer"
            >
              <option value="">Select League</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (T{l.tier})
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-xs font-bold border animate-in fade-in ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}
            >
              {message.text}
            </div>
          )}

          {/* 2. TEAM GENERATOR */}
          <section className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                Team Draft
              </h2>
              {eloStats && (
                <div className="flex gap-6 items-center bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-500 uppercase">
                      League Min/Max
                    </span>
                    <span className="text-[10px] font-bold text-gray-300 tabular-nums">
                      {eloStats.min} — {eloStats.max}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-500 uppercase">
                      Current Avg
                    </span>
                    <span className="text-[10px] font-bold text-gray-300 tabular-nums">
                      {eloStats.avg}
                    </span>
                  </div>
                  {previewTeam && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex flex-col text-right">
                        <span className="text-[7px] font-black text-teal-500/60 uppercase">
                          Impact
                        </span>
                        <span className="text-[10px] font-black text-white tabular-nums">
                          {eloStats.newAvg}{" "}
                          <span
                            className={
                              eloStats.diff >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {eloStats.diff >= 0 ? "↑" : "↓"}
                            {Math.abs(eloStats.diff)}
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {!previewTeam ? (
              <button
                onClick={handleGenerateTeam}
                disabled={!selectedLeague || leagueStatus?.isFull || isPending}
                className="w-full bg-gray-900 border border-white/10 hover:border-teal-500/50 p-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition disabled:opacity-20 shadow-xl"
              >
                {leagueStatus?.isFull
                  ? "League Full"
                  : "Draft New Team Identity"}
              </button>
            ) : (
              <div className="bg-gray-900 border border-teal-500/30 rounded-2xl overflow-hidden animate-in zoom-in-95 shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-black/60 to-transparent">
                  <div className="flex items-center gap-6">
                    <div className="bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl flex flex-col items-center min-w-[80px]">
                      <span className="text-[8px] font-black text-teal-500/60 uppercase">
                        ELO Rating
                      </span>
                      <span className="text-2xl font-black text-teal-400 leading-none mt-1">
                        {previewTeam.elo_rating}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none">
                        {previewTeam.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-[0.3em]">
                        Country:{" "}
                        <span className="text-gray-300">
                          {previewTeam.nationality_id}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreviewTeam(null)}
                      className="px-5 py-2.5 rounded-xl text-[10px] font-black bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition border border-white/10"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleGenerateTeam}
                      className="px-5 py-2.5 rounded-xl text-[10px] font-black bg-white/5 hover:bg-teal-500/10 hover:text-teal-400 transition border border-white/10"
                    >
                      Re-Roll
                    </button>
                    <button
                      onClick={handleSaveTeam}
                      className="px-6 py-2.5 rounded-xl text-[10px] font-black bg-teal-600 hover:bg-teal-500 shadow-lg text-black transition"
                    >
                      Commit Identity
                    </button>
                  </div>
                </div>
                <div className="bg-black/40 py-4 px-8 flex items-center justify-between gap-2">
                  {Object.entries(previewTeam.tactics).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-1 flex-col items-center"
                    >
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1">
                        {key.replace("_", " ")}
                      </span>
                      <span className="text-sm font-black text-white">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 3. SQUAD ARCHITECT */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 text-center">
              Squad Architect
            </h2>
            <div className="space-y-3">
              <div className="flex gap-4">
                <select
                  onChange={(e) =>
                    setSelectedTeam(
                      teamsInLeague.find((t) => t.id === e.target.value),
                    )
                  }
                  className="flex-1 bg-gray-900 border border-white/10 p-4 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500"
                >
                  <option value="">Select Team to Populate</option>
                  {teamsInLeague.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (ELO: {t.elo_rating})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGenerateSquad}
                  disabled={!selectedTeam || isPending}
                  className="bg-teal-600 hover:bg-teal-500 px-8 rounded-xl font-black uppercase text-[10px] transition disabled:opacity-20"
                >
                  Generate 35 Players
                </button>
              </div>
              {selectedTeam && (
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`w-2 h-2 rounded-full ${currentSquadSize >= 35 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    Current Roster: {currentSquadSize} / 35
                  </span>
                </div>
              )}
            </div>

            {previewSquad.length > 0 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gray-900/30 border border-white/5 p-4 rounded-2xl flex flex-wrap justify-center gap-3">
                  {nationalitySummary.map(([nation, count]) => (
                    <div
                      key={nation}
                      className="bg-black/40 border border-white/5 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-[10px] font-black text-teal-500">
                        {nation}
                      </span>
                      <span className="text-[10px] font-bold text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-900 border border-teal-500/30 rounded-2xl overflow-hidden shadow-2xl overflow-y-auto max-h-[600px]">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-black sticky top-0 text-gray-500 font-black uppercase z-20">
                      <tr>
                        <th className="p-4 w-8"></th>
                        <th
                          className="p-4 cursor-pointer hover:text-white"
                          onClick={() => handleSort("name")}
                        >
                          NAME
                        </th>
                        <th className="p-2 text-center">NAT</th>
                        <th
                          className="p-2 text-center cursor-pointer"
                          onClick={() => handleSort("age")}
                        >
                          AGE
                        </th>
                        <th className="p-2 text-center">POS</th>
                        <th
                          className="p-2 text-center cursor-pointer"
                          onClick={() => handleSort("ovr")}
                        >
                          OVR
                        </th>
                        {["pac", "sho", "pas", "dri", "def", "phy"].map(
                          (attr) => (
                            <th
                              key={attr}
                              className="p-2 text-center text-teal-500/50 cursor-pointer"
                              onClick={() => handleSort(attr as SortKey)}
                            >
                              {attr.toUpperCase()}
                            </th>
                          ),
                        )}
                        <th className="p-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedSquad.map((p) => (
                        <tr
                          key={p.id}
                          className={`transition-colors group ${selectedPlayerIds.has(p.id) ? "bg-teal-500/10" : "opacity-40 hover:opacity-100"}`}
                        >
                          <td
                            className="p-4"
                            onClick={() => togglePlayerSelection(p.id)}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPlayerIds.has(p.id) ? "bg-teal-500 border-teal-500" : "border-white/20"}`}
                            >
                              {selectedPlayerIds.has(p.id) && "✓"}
                            </div>
                          </td>
                          <td className="p-4 font-bold uppercase text-white whitespace-nowrap">
                            {p.name}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {p.nationality_id}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {p.age}
                          </td>
                          <td className="p-2 text-center text-teal-500 font-black">
                            {p.position}
                          </td>
                          <td className="p-2 text-center font-black text-white bg-white/5">
                            {p.ovr}
                          </td>
                          {["pac", "sho", "pas", "dri", "def", "phy"].map(
                            (attr) => (
                              <td
                                key={attr}
                                className="p-2 text-center text-gray-400"
                              >
                                {(p as any).attributes?.[attr]}
                              </td>
                            ),
                          )}
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleReplacePlayer(p)}
                              className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-red-500/20 hover:text-red-500 transition uppercase font-black"
                            >
                              Replace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 bg-black/50 flex gap-4">
                    <button
                      onClick={handleSaveSquad}
                      disabled={selectedPlayerIds.size === 0 || isPending}
                      className="flex-1 bg-green-600 hover:bg-green-500 p-4 rounded-xl font-black uppercase text-[10px]"
                    >
                      Commit Selected ({selectedPlayerIds.size})
                    </button>
                    <button
                      onClick={() => setPreviewSquad([])}
                      className="flex-1 bg-white/5 p-4 rounded-xl font-black uppercase text-[10px] text-gray-500"
                    >
                      Discard All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="bg-gray-900 border border-white/5 p-6 rounded-2xl h-fit sticky top-8 space-y-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">
            League Status
          </h3>
          {leagueStatus && (
            <div className="space-y-6">
              <p className="text-4xl font-black text-teal-500">
                {leagueStatus.current}{" "}
                <span className="text-sm text-gray-700">
                  / {leagueStatus.max}
                </span>
              </p>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-teal-500"
                  style={{
                    width: `${(leagueStatus.current / leagueStatus.max) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() =>
                confirm("Wipe database?") &&
                deleteAllTeamsAction().then(() => window.location.reload())
              }
              className="w-full text-[9px] font-black text-red-900 hover:text-red-500 uppercase tracking-[0.2em] py-2"
            >
              Wipe Database
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
