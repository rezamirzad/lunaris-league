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

  // Sorting & Size State
  const [sortKey, setSortKey] = useState<SortKey>("ovr");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentSquadSize, setCurrentSquadSize] = useState<number>(0);

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
      setPreviewSquad([]);
    }
  }, [selectedNation]);

  useEffect(() => {
    if (selectedLeague) {
      getLeagueLimitAction(selectedLeague).then(setLeagueStatus);
      getTeamsByLeagueAction(selectedLeague).then(setTeamsInLeague);
      setPreviewTeam(null);
    }
  }, [selectedLeague]);

  useEffect(() => {
    if (selectedTeam) {
      getTeamSquadSizeAction(selectedTeam.id).then(setCurrentSquadSize);
    } else {
      setCurrentSquadSize(0);
    }
  }, [selectedTeam]);

  // Sorting logic
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

  // Nationality Summary logic
  const nationalitySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    previewSquad.forEach((p) => {
      counts[p.nationality_id] = (counts[p.nationality_id] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [previewSquad]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const handleGenerateSquad = () => {
    if (!selectedTeam) return;
    if (currentSquadSize >= 35) {
      const proceed = confirm(
        `Warning: ${selectedTeam.name} already has ${currentSquadSize} players. Continue?`,
      );
      if (!proceed) return;
    }
    const leagueTier = leagues.find((l) => l.id === selectedLeague)?.tier || 4;
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
    const leagueTier = leagues.find((l) => l.id === selectedLeague)?.tier || 4;
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

  const togglePlayerSelection = (id: string) => {
    const newSelection = new Set(selectedPlayerIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedPlayerIds(newSelection);
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
      <header className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black italic text-teal-500 uppercase tracking-tighter">
          Admin Portal
        </h1>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-12">
          {/* SELECTORS */}
          <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-6 rounded-2xl border border-white/5">
            <select
              value={selectedNation}
              onChange={(e) => setSelectedNation(e.target.value)}
              className="bg-black border border-white/10 p-3 rounded-xl text-xs uppercase font-bold outline-none focus:border-teal-500 transition"
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
              className="bg-black border border-white/10 p-3 rounded-xl text-xs uppercase font-bold outline-none focus:border-teal-500 disabled:opacity-20 transition"
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

          {/* SQUAD ARCHITECT */}
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
                  className="flex-1 bg-gray-900 border border-white/10 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-teal-500"
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
                  Generate Squad
                </button>
              </div>
              {selectedTeam && (
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`w-2 h-2 rounded-full ${currentSquadSize >= 35 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${currentSquadSize >= 35 ? "text-red-400" : "text-gray-500"}`}
                  >
                    Current Roster: {currentSquadSize} / 35
                  </span>
                </div>
              )}
            </div>

            {/* NATIONALITY SUMMARY SECTION */}
            {previewSquad.length > 0 && (
              <div className="bg-gray-900/30 border border-white/5 p-4 rounded-2xl animate-in fade-in">
                <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
                  Nationality Distribution
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
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
              </div>
            )}

            {/* PLAYER TABLE */}
            {previewSquad.length > 0 && (
              <div className="bg-gray-900 border border-teal-500/30 rounded-2xl overflow-hidden animate-in fade-in shadow-2xl">
                <div className="max-h-[600px] overflow-y-auto">
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
                        <th
                          className="p-2 text-center cursor-pointer hover:text-white"
                          onClick={() => handleSort("nationality_id")}
                        >
                          NAT
                        </th>
                        <th
                          className="p-2 text-center cursor-pointer hover:text-white"
                          onClick={() => handleSort("age")}
                        >
                          AGE
                        </th>
                        <th
                          className="p-2 text-center cursor-pointer hover:text-white"
                          onClick={() => handleSort("position")}
                        >
                          POS
                        </th>
                        <th
                          className="p-2 text-center cursor-pointer hover:text-white"
                          onClick={() => handleSort("ovr")}
                        >
                          OVR
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("pac")}
                        >
                          PAC
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("sho")}
                        >
                          SHO
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("pas")}
                        >
                          PAS
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("dri")}
                        >
                          DRI
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("def")}
                        >
                          DEF
                        </th>
                        <th
                          className="p-2 text-center text-teal-500/50 cursor-pointer"
                          onClick={() => handleSort("phy")}
                        >
                          PHY
                        </th>
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
                              {selectedPlayerIds.has(p.id) && (
                                <span className="text-black font-black">✓</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold uppercase text-white whitespace-nowrap">
                            {p.name}
                          </td>
                          <td className="p-2 text-center font-bold text-gray-400">
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
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.pac}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.sho}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.pas}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.dri}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.def}
                          </td>
                          <td className="p-2 text-center text-gray-400">
                            {(p as any).attributes?.phy}
                          </td>
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
                </div>
                <div className="p-4 bg-black/50 flex gap-4">
                  <button
                    onClick={handleSaveSquad}
                    disabled={selectedPlayerIds.size === 0 || isPending}
                    className="flex-1 bg-green-600 hover:bg-green-500 p-4 rounded-xl font-black uppercase text-[10px] disabled:opacity-50"
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
            )}
          </section>
        </div>

        <aside className="bg-gray-900 border border-white/5 p-6 rounded-2xl h-fit sticky top-8">
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
        </aside>
      </main>
    </div>
  );
}
