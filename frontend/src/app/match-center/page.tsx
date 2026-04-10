"use client";

import { useState, useEffect } from "react";
import {
  getTeamsByLeagueAction,
  getNationalitiesAction,
  getLeaguesByNationAction,
} from "../actions/dbActions";
import {
  getSimDataAction,
  simulateFullMatchAction,
} from "../actions/simActions";
import Link from "next/link";

export default function MatchCenter() {
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");

  const [matchData, setMatchData] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  useEffect(() => {
    if (selectedNation) {
      getLeaguesByNationAction(selectedNation).then(setLeagues);
      setTeams([]);
    }
  }, [selectedNation]);

  useEffect(() => {
    if (selectedLeague) {
      getTeamsByLeagueAction(selectedLeague).then(setTeams);
    }
  }, [selectedLeague]);

  const handlePrepareMatch = async () => {
    if (!homeId || !awayId) return;
    const data = await getSimDataAction(homeId, awayId);
    setMatchData(data);
    setResult(null);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    // Short artificial delay for "calculating" feel
    setTimeout(async () => {
      const res = await simulateFullMatchAction(matchData.home, matchData.away);
      setResult(res);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center border-b border-white/5 pb-6 mb-12">
        <h1 className="text-2xl font-black italic text-teal-500 uppercase tracking-tighter">
          Match Center
        </h1>
        <Link
          href="/"
          className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest"
        >
          Return Home
        </Link>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* SELECTORS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-2xl border border-white/5">
          <select
            value={selectedNation}
            onChange={(e) => setSelectedNation(e.target.value)}
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500"
          >
            <option value="">Nation</option>
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
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500 disabled:opacity-20"
          >
            <option value="">League</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            value={homeId}
            onChange={(e) => setHomeId(e.target.value)}
            disabled={teams.length === 0}
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500 disabled:opacity-20"
          >
            <option value="">Home Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={awayId}
            onChange={(e) => setAwayId(e.target.value)}
            disabled={teams.length === 0}
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500 disabled:opacity-20"
          >
            <option value="">Away Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrepareMatch}
          disabled={!homeId || !awayId || homeId === awayId}
          className="w-full bg-white text-black font-black uppercase text-[10px] py-4 rounded-xl hover:bg-teal-500 transition disabled:opacity-20"
        >
          Prepare Match
        </button>

        {matchData && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* SCOREBOARD & STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-10 text-center flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5">
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-2">
                  Home
                </span>
                <h2 className="text-2xl font-black uppercase italic">
                  {matchData.home.name}
                </h2>
                <p className="text-xs text-gray-500 mt-2">
                  ELO: {matchData.home.elo_rating} | OVR:{" "}
                  {matchData.home.avgOvr}
                </p>
              </div>

              <div className="bg-black/40 p-10 flex flex-col items-center justify-center">
                {result ? (
                  <>
                    <div className="text-6xl font-black italic flex gap-6 mb-6 animate-in bounce-in">
                      <span
                        className={
                          result.homeGoals > result.awayGoals
                            ? "text-teal-500"
                            : "text-white"
                        }
                      >
                        {result.homeGoals}
                      </span>
                      <span className="text-gray-800">-</span>
                      <span
                        className={
                          result.awayGoals > result.homeGoals
                            ? "text-teal-500"
                            : "text-white"
                        }
                      >
                        {result.awayGoals}
                      </span>
                    </div>
                    {/* QUICK STATS SUMMARY */}
                    <div className="w-full grid grid-cols-3 text-[9px] font-black uppercase tracking-tighter text-gray-400">
                      <div className="text-right space-y-1">
                        <p>
                          {result.stats.home.shots} (
                          {result.stats.home.onTarget})
                        </p>
                        <p>{result.stats.home.corners}</p>
                        <p>{result.stats.home.fouls}</p>
                      </div>
                      <div className="text-center space-y-1 text-gray-600 px-2">
                        <p>Shots (OT)</p>
                        <p>Corners</p>
                        <p>Fouls</p>
                      </div>
                      <div className="text-left space-y-1">
                        <p>
                          ({result.stats.away.onTarget}){" "}
                          {result.stats.away.shots}
                        </p>
                        <p>{result.stats.away.corners}</p>
                        <p>{result.stats.away.fouls}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-black italic opacity-10 uppercase tracking-tighter">
                    Ready
                  </div>
                )}
              </div>

              <div className="p-10 text-center flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/5">
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-2">
                  Away
                </span>
                <h2 className="text-2xl font-black uppercase italic">
                  {matchData.away.name}
                </h2>
                <p className="text-xs text-gray-500 mt-2">
                  ELO: {matchData.away.elo_rating} | OVR:{" "}
                  {matchData.away.avgOvr}
                </p>
              </div>
            </div>

            {/* EVENT TIMELINE - STRICT VERTICAL */}
            {result && (
              <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {result.events.map((event: any, i: number) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2 border-b border-white/[0.03] last:border-0 animate-in fade-in slide-in-from-top-1"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {/* Home Side Event */}
                      <div className="text-right">
                        {event.isHome && (
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-[10px] text-white uppercase font-bold truncate">
                              {event.playerName || event.scorerName}
                            </span>
                            <span className="text-[14px] leading-none flex items-center">
                              {event.type === "GOAL" ? (
                                <span className="relative inline-flex">
                                  ⚽
                                  {event.isPenalty && (
                                    <span className="absolute -top-1.5 -right-1 text-[7px] font-black bg-black text-teal-400 border border-teal-400/30 rounded-full w-3 h-3 flex items-center justify-center tracking-tighter shadow-sm">
                                      P
                                    </span>
                                  )}
                                </span>
                              ) : event.type === "YELLOW" ? (
                                "🟨"
                              ) : (
                                "🟥"
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Minute (Center Pillar) */}
                      <div className="flex flex-col items-center">
                        <div className="w-px h-2 bg-white/10" />
                        <span className="text-[12px] font-black text-teal-500 bg-black px-2 py-0.5 rounded border border-white/10 tabular-nums">
                          {event.minute}&apos;
                        </span>
                        <div className="w-px h-2 bg-white/10" />
                      </div>

                      {/* Away Side Event */}
                      <div className="text-left">
                        {!event.isHome && (
                          <div className="flex items-center justify-start gap-3">
                            <span className="text-[14px] leading-none flex items-center">
                              {event.type === "GOAL" ? (
                                <span className="relative inline-flex">
                                  ⚽
                                  {event.isPenalty && (
                                    <span className="absolute -top-1.5 -right-1 text-[7px] font-black bg-black text-teal-400 border border-teal-400/30 rounded-full w-3 h-3 flex items-center justify-center tracking-tighter shadow-sm">
                                      P
                                    </span>
                                  )}
                                </span>
                              ) : event.type === "YELLOW" ? (
                                "🟨"
                              ) : (
                                "🟥"
                              )}
                            </span>
                            <span className="text-[10px] text-white uppercase font-bold truncate">
                              {event.playerName || event.scorerName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROSTERS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[matchData.home, matchData.away].map((team, idx) => (
                <div
                  key={team.id}
                  className="bg-gray-900/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
                >
                  {/* Formation Watermark */}
                  <div className="absolute -right-4 -bottom-4 text-7xl font-black text-white/[0.02] italic pointer-events-none uppercase">
                    {team.formation}
                  </div>

                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">
                    {idx === 0 ? "Home Squad" : "Away Squad"}
                    <div className="h-px flex-1 bg-white/5" />
                  </h3>

                  {/* STARTERS */}
                  <div className="space-y-2 mb-8">
                    {team.starters.map((p: any) => {
                      // 1. Get player events and sort them by minute for chronological icons
                      const pEvents = (result?.events || [])
                        .filter((e: any) => e.playerId === p.id)
                        .sort((a: any, b: any) => a.minute - b.minute);

                      const isRed = pEvents.some((e: any) => e.type === "RED");

                      return (
                        <div
                          key={p.id}
                          className={`flex justify-between items-center text-[11px] group transition-all ${isRed ? "opacity-100" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 text-[8px] font-bold py-0.5 rounded text-center border border-white/5 ${
                                p.position === "GK"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : ["ST", "LW", "RW", "CF"].includes(
                                        p.position,
                                      )
                                    ? "bg-red-500/10 text-red-500"
                                    : ["CM", "CDM", "CAM", "LM", "RM"].includes(
                                          p.position,
                                        )
                                      ? "bg-green-500/10 text-green-500"
                                      : "bg-blue-500/10 text-blue-500"
                              }`}
                            >
                              {p.position}
                            </span>
                            <span
                              className={`font-bold uppercase tracking-tight ${isRed ? "line-through text-red-900" : "text-gray-300 group-hover:text-white"}`}
                            >
                              {p.name}
                            </span>

                            {/* CHRONOLOGICAL ICONS */}
                            <div className="flex gap-1 items-center">
                              {pEvents.map((e: any, ei: number) => (
                                <span
                                  key={ei}
                                  className="text-[10px] animate-in zoom-in"
                                  title={`${e.minute}'`}
                                >
                                  {e.type === "GOAL"
                                    ? "⚽"
                                    : e.type === "YELLOW"
                                      ? "🟨"
                                      : "🟥"}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="font-black text-white/20 group-hover:text-white/60 tabular-nums">
                            {p.ovr}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* SUBSTITUTES (7 Players) */}
                  <div className="pt-6 border-t border-white/5 space-y-1.5">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-3">
                      Bench
                    </span>
                    {team.subs.map((p: any) => {
                      const pEvents = (result?.events || [])
                        .filter((e: any) => e.playerId === p.id)
                        .sort((a: any, b: any) => a.minute - b.minute);

                      const isRed = pEvents.some((e: any) => e.type === "RED");

                      return (
                        <div
                          key={p.id}
                          className={`flex justify-between items-center text-[10px] opacity-50 hover:opacity-100 transition-all ${isRed ? "grayscale opacity-20" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 text-[7px] font-bold py-0.5 rounded text-center ${
                                p.position === "GK"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : ["ST", "LW", "RW"].includes(p.position)
                                    ? "bg-red-500/10 text-red-500"
                                    : ["CM", "CDM", "CAM"].includes(p.position)
                                      ? "bg-green-500/10 text-green-500"
                                      : "bg-blue-500/10 text-blue-500"
                              }`}
                            >
                              {p.position}
                            </span>
                            <span
                              className={`font-bold uppercase ${isRed ? "line-through" : ""}`}
                            >
                              {p.name}
                            </span>

                            {/* CHRONOLOGICAL ICONS FOR SUBS */}
                            <div className="flex gap-1">
                              {pEvents.map((e: any, ei: number) => (
                                <span key={ei}>
                                  {e.type === "GOAL"
                                    ? "⚽"
                                    : e.type === "YELLOW"
                                      ? "🟨"
                                      : "🟥"}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="font-black opacity-30">{p.ovr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!result && (
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full bg-teal-600 hover:bg-teal-500 py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-xs transition-all"
              >
                {isSimulating ? "Simulating..." : "Kick Off"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
