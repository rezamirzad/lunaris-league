"use client";

import { useState, useEffect } from "react";
import {
  getTeamsByLeagueAction,
  getNationalitiesAction,
  getLeaguesByNationAction,
} from "../actions/dbActions";
import { getSimDataAction, simulateMatchAction } from "../actions/simActions";
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
    // Artificial delay for tension
    setTimeout(async () => {
      const res = await simulateMatchAction(matchData.home, matchData.away);
      setResult(res);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center border-b border-white/5 pb-6 mb-12">
        <h1 className="text-2xl font-black italic text-teal-500 uppercase">
          Match Center
        </h1>
        <Link
          href="/"
          className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest"
        >
          Return Home
        </Link>
      </header>

      <main className="max-w-5xl mx-auto space-y-12">
        {/* SELECTORS */}
        <div className="grid grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-2xl border border-white/5">
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
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500"
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
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500"
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
            className="bg-black border border-white/10 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-teal-500"
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
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* MATCH BOARD */}
            <div className="grid grid-cols-3 items-center bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Home Side */}
              <div className="p-12 text-center space-y-4">
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">
                  Home
                </span>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  {matchData.home.name}
                </h2>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase">
                      ELO
                    </span>
                    <span className="font-bold">
                      {matchData.home.elo_rating}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase">
                      SQUAD OVR
                    </span>
                    <span className="font-bold">{matchData.home.avgOvr}</span>
                  </div>
                </div>
              </div>

              {/* VS / SCORE */}
              <div className="bg-black/40 h-full flex flex-col items-center justify-center border-x border-white/5">
                {result ? (
                  <div className="text-7xl font-black italic tracking-tighter flex gap-8 animate-in bounce-in">
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
                ) : (
                  <div className="text-4xl font-black text-gray-800 italic">
                    VS
                  </div>
                )}
                {result && (
                  <span className="text-[9px] font-bold text-gray-600 uppercase mt-4 tracking-widest">
                    Attendance: {result.attendance.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Away Side */}
              <div className="p-12 text-center space-y-4">
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">
                  Away
                </span>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  {matchData.away.name}
                </h2>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase">
                      ELO
                    </span>
                    <span className="font-bold">
                      {matchData.away.elo_rating}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase">
                      SQUAD OVR
                    </span>
                    <span className="font-bold">{matchData.away.avgOvr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sim Button */}
            {!result && (
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full mt-8 bg-teal-600 hover:bg-teal-500 py-6 rounded-2xl font-black uppercase tracking-[0.5em] text-xs transition relative overflow-hidden"
              >
                {isSimulating ? "Simulating Strategy..." : "Execute Simulation"}
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
