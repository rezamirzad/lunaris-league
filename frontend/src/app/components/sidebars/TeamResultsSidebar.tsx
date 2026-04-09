"use client";

import { useMemo } from "react";

export const TeamResultsSidebar = ({ teamName, matches, onClose }: any) => {
  // Calculate form dots based on match history
  const formDots = useMemo(() => {
    return matches
      .map((m: any): string => {
        // Define return type as string
        const isHome = m.homeTeamName === teamName;
        if (m.home_goals === m.away_goals) return "D";
        const won = isHome
          ? m.home_goals > m.away_goals
          : m.away_goals > m.home_goals;
        return won ? "W" : "L";
      })
      .slice(-10);
  }, [matches, teamName]);

  return (
    <div className="w-80 bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-300">
      {/* Header Styled like Table Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/60 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-teal-500 uppercase tracking-tighter italic">
            {teamName}{" "}
            <span className="text-gray-500 ml-2 not-italic font-bold text-[10px] tracking-widest">
              RESULTS
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xs p-1"
          >
            ✕
          </button>
        </div>

        {/* Form Dots in Sidebar Header */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            Recent Form:
          </span>
          <div className="flex gap-1">
            {formDots.map((result: string, i: number) => (
              <span
                key={i}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ${
                  result === "W"
                    ? "bg-teal-500"
                    : result === "D"
                      ? "bg-gray-500"
                      : "bg-red-900"
                }`}
              >
                {result}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
        {matches.map((m: any) => {
          const isHome = m.homeTeamName === teamName;
          const isWin = isHome
            ? m.home_goals > m.away_goals
            : m.away_goals > m.home_goals;
          const isDraw = m.home_goals === m.away_goals;

          return (
            <div
              key={m.id}
              className="group border border-gray-800/50 bg-black/20 rounded-lg p-2 hover:bg-teal-500/5 transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-gray-600 tracking-widest uppercase">
                  MW {m.matchweek}
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 rounded ${
                    isDraw
                      ? "text-yellow-600 bg-yellow-600/10"
                      : isWin
                        ? "text-teal-500 bg-teal-500/10"
                        : "text-red-900 bg-red-900/10"
                  }`}
                >
                  {isDraw ? "D" : isWin ? "W" : "L"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 text-[11px]">
                <span
                  className={`flex-1 truncate ${isHome ? "text-gray-200 font-bold" : "text-gray-500"}`}
                >
                  {m.homeTeamName}
                </span>
                <div className="flex items-center gap-1 bg-gray-800/80 px-2 py-0.5 rounded font-mono text-teal-400 font-bold shadow-inner">
                  <span>{m.home_goals}</span>
                  <span className="text-gray-600 text-[9px]">-</span>
                  <span>{m.away_goals}</span>
                </div>
                <span
                  className={`flex-1 truncate text-right ${!isHome ? "text-gray-200 font-bold" : "text-gray-500"}`}
                >
                  {m.awayTeamName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
