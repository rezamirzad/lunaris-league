"use client";

import { useState, useEffect } from "react";
import {
  getTeamsByLeagueAction,
  getNationalitiesAction,
  getLeaguesByNationAction,
} from "../actions/dbActions";
import { getSimDataAction, simulateMatchAction } from "../actions/simActions";
import Link from "next/link";
import { TacticalPitch } from "../components/TacticalPitch";

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
    setTimeout(async () => {
      const res = await simulateMatchAction(matchData.home, matchData.away);
      setResult(res);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-white/5 pb-6 mb-12">
        <div>
          <h1 className="text-2xl font-black italic text-teal-500 uppercase tracking-tighter">
            Match Center
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
            Tactical Simulation Engine
          </p>
        </div>
        <Link
          href="/"
          className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition"
        >
          Return Home
        </Link>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* SELECTORS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-2xl border border-white/5 shadow-2xl">
          <select
            value={selectedNation}
            onChange={(e) => setSelectedNation(e.target.value)}
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500 transition"
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
          className="w-full bg-white text-black font-black uppercase text-[10px] py-4 rounded-xl hover:bg-teal-500 transition disabled:opacity-20 shadow-lg"
        >
          Prepare Match Context
        </button>

        {matchData && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* 1. MATCH BOARD & TIMELINE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Home Identity */}
              <div className="flex flex-col">
                <div className="p-12 text-center flex-1 flex flex-col justify-center space-y-2">
                  <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">
                    Home
                  </span>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    {matchData.home.name}
                  </h2>
                </div>
                <div className="bg-black/20 border-t border-white/5 py-4 px-6 flex justify-around">
                  <div className="text-center">
                    <span className="text-[7px] text-gray-500 uppercase font-black block tracking-widest">
                      ELO Rating
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {matchData.home.elo_rating}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/5" />
                  <div className="text-center">
                    <span className="text-[7px] text-gray-500 uppercase font-black block tracking-widest">
                      Squad OVR
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {matchData.home.avgOvr}
                    </span>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: SCORE & TIMELINE */}
              <div className="bg-black/60 min-h-[450px] flex flex-col items-center py-10 border-x border-white/10">
                {result ? (
                  <>
                    <div className="text-7xl font-black italic tracking-tighter flex gap-8 animate-in bounce-in mb-10">
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

                    <div className="w-full px-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                      {result.events.map((event: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-[10px] font-bold animate-in fade-in slide-in-from-top-2"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div
                            className={`flex items-center gap-2 flex-1 ${!event.isHome ? "flex-row-reverse text-right" : "text-left"}`}
                          >
                            <span className="text-teal-500 tabular-nums w-6">
                              {event.minute}&apos;
                            </span>
                            <span className="text-white uppercase truncate max-w-[110px]">
                              {event.playerName || event.scorerName}
                            </span>
                            <span className="text-xs">
                              {event.type === "GOAL" && "⚽"}
                              {event.type === "YELLOW" && "🟨"}
                              {event.type === "RED" && "🟥"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 w-full text-center border-t border-white/5 opacity-40">
                      <span className="text-[8px] font-black uppercase tracking-[0.5em]">
                        Full Time
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-10">
                    <div className="text-6xl font-black italic">VS</div>
                  </div>
                )}
              </div>

              {/* Away Identity */}
              <div className="flex flex-col">
                <div className="p-12 text-center flex-1 flex flex-col justify-center space-y-2">
                  <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">
                    Away
                  </span>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    {matchData.away.name}
                  </h2>
                </div>
                <div className="bg-black/20 border-t border-white/5 py-4 px-6 flex justify-around">
                  <div className="text-center">
                    <span className="text-[7px] text-gray-500 uppercase font-black block tracking-widest">
                      ELO Rating
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {matchData.away.elo_rating}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/5" />
                  <div className="text-center">
                    <span className="text-[7px] text-gray-500 uppercase font-black block tracking-widest">
                      Squad OVR
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {matchData.away.avgOvr}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TACTICAL PITCH VISUALIZATION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TacticalPitch
                teamName={matchData.home.name}
                formation={matchData.home.formation}
                players={matchData.home.starters}
                resultEvents={result?.events}
                isHome={true}
              />
              <TacticalPitch
                teamName={matchData.away.name}
                formation={matchData.away.formation}
                players={matchData.away.starters}
                resultEvents={result?.events}
                isHome={false}
              />
            </div>

            {/* 3. ROSTER DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[matchData.home, matchData.away].map((team, idx) => (
                <div
                  key={team.id}
                  className="bg-gray-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-xl"
                >
                  <div className="absolute -right-4 -bottom-4 text-8xl font-black text-white/[0.02] italic pointer-events-none uppercase">
                    {team.formation}
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-4">
                    {idx === 0 ? "Home Roster" : "Away Roster"}
                    <div className="h-px flex-1 bg-white/5" />
                  </h3>
                  <div className="space-y-2">
                    {team.starters.map((p: any) => {
                      const pEvents =
                        result?.events.filter(
                          (e: any) => e.playerId === p.id,
                        ) || [];
                      const goals = pEvents.filter(
                        (e: any) => e.type === "GOAL",
                      ).length;
                      const hasYellow = pEvents.some(
                        (e: any) => e.type === "YELLOW",
                      );
                      const isSentOff = pEvents.some(
                        (e: any) => e.type === "RED",
                      );

                      return (
                        <div
                          key={p.id}
                          className={`flex justify-between items-center py-1 transition-all duration-500 ${
                            isSentOff ? "opacity-40 grayscale" : "group"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Position Badge - Now color coded like the bench */}
                            <div
                              className={`w-8 text-[9px] font-black px-1 py-1 rounded-sm text-center border border-white/5 transition-colors ${
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
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold uppercase tracking-tight transition-colors ${
                                  goals > 0
                                    ? "text-teal-400"
                                    : isSentOff
                                      ? "line-through text-red-900"
                                      : "text-gray-300 group-hover:text-white"
                                }`}
                              >
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 ml-1">
                                {Array.from({ length: goals }).map((_, i) => (
                                  <span key={i} className="text-[10px]">
                                    ⚽
                                  </span>
                                ))}
                                {hasYellow && (
                                  <span className="text-[10px]">🟨</span>
                                )}
                                {isSentOff && (
                                  <span className="text-[10px] text-red-500">
                                    🟥
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-black tabular-nums transition-opacity ${
                              goals > 0
                                ? "text-teal-400"
                                : "text-white opacity-40 group-hover:opacity-100"
                            }`}
                          >
                            {p.ovr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Bench */}
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-1.5 relative z-10">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                      Substitutes
                    </span>
                    {team.subs.map((p: any) => {
                      const pEvents =
                        result?.events.filter(
                          (e: any) => e.playerId === p.id,
                        ) || [];
                      const goals = pEvents.filter(
                        (e: any) => e.type === "GOAL",
                      ).length;
                      const hasYellow = pEvents.some(
                        (e: any) => e.type === "YELLOW",
                      );
                      const isSentOff = pEvents.some(
                        (e: any) => e.type === "RED",
                      );
                      return (
                        <div
                          key={p.id}
                          className={`flex justify-between items-center py-0.5 opacity-60 hover:opacity-100 transition-all ${isSentOff ? "grayscale opacity-20" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 text-[9px] font-black px-1 py-0.5 rounded-sm text-center ${p.position === "GK" ? "bg-orange-500/10 text-orange-500" : ["ST", "LW", "RW", "CF"].includes(p.position) ? "bg-red-500/10 text-red-500" : ["CM", "CDM", "CAM", "LM", "RM"].includes(p.position) ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}
                            >
                              {p.position}
                            </div>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-tight ${goals > 0 ? "text-teal-400" : "text-gray-400"}`}
                            >
                              {p.name}
                            </span>
                            {goals > 0 && (
                              <span className="text-[10px]">⚽</span>
                            )}
                            {hasYellow && (
                              <span className="text-[10px]">🟨</span>
                            )}
                            {isSentOff && (
                              <span className="text-[10px]">🟥</span>
                            )}
                          </div>
                          <span className="text-[11px] font-black tabular-nums text-gray-500">
                            {p.ovr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sim Button (Only visible after preparing and before results) */}
            {!result && (
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full mt-8 bg-teal-600 hover:bg-teal-500 py-6 rounded-2xl font-black uppercase tracking-[0.5em] text-xs transition-all shadow-xl shadow-teal-500/20 relative overflow-hidden"
              >
                {isSimulating
                  ? "Processing Tactical Engine..."
                  : "Execute Simulation"}
                {isSimulating && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white animate-progress-fast w-full" />
                )}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
