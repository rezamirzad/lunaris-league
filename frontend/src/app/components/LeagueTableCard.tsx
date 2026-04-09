"use client";

import { useState } from "react";
import { LeagueTableEntry } from "../models";
import { getTeamMatchesAction } from "../actions/dbActions";
import { TeamResultsSidebar } from "./sidebars/TeamResultsSidebar";
import { SeasonSummaryCard } from "./SeasonSummaryCard";

export const LeagueTableCard = ({
  data,
  title,
  seasonStats,
}: {
  data: LeagueTableEntry[];
  title?: string;
  seasonStats: any;
}) => {
  const [selectedTeamResults, setSelectedTeamResults] = useState<{
    name: string;
    matches: any[];
  } | null>(null);
  const isSidebarOpen = !!selectedTeamResults;

  const handleTeamClick = async (teamId: string, teamName: string) => {
    const matches = await getTeamMatchesAction(teamId, "s_2526");
    setSelectedTeamResults({ name: teamName, matches });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full animate-in fade-in duration-500">
      <div
        className={`transition-all duration-300 w-full ${isSidebarOpen ? "max-w-xl" : "max-w-5xl"}`}
      >
        {title && (
          <h2 className="text-xl font-bold mb-4 text-teal-500 uppercase tracking-tight italic border-l-4 border-teal-500 pl-3">
            {title}
          </h2>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 shadow-2xl">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-900/60 text-gray-500 uppercase text-[9px] font-black tracking-widest border-b border-gray-800">
                <th className="w-8 px-2 py-3 text-center">#</th>
                <th className="px-3 py-3">Team</th>
                <th className="w-10 px-2 py-3 text-center">P</th>
                {!isSidebarOpen && (
                  <>
                    <th className="w-10 px-2 py-3 text-center text-[8px]">W</th>
                    <th className="w-10 px-2 py-3 text-center text-[8px]">D</th>
                    <th className="w-10 px-2 py-3 text-center text-[8px]">L</th>
                    <th className="w-12 px-2 py-3 text-center text-[8px]">
                      GF
                    </th>
                    <th className="w-12 px-2 py-3 text-center text-[8px]">
                      GA
                    </th>
                  </>
                )}
                <th className="w-12 px-2 py-3 text-center text-[8px]">GD</th>
                <th className="w-14 px-3 py-3 text-center text-teal-400 text-[8px]">
                  Pts
                </th>
                {!isSidebarOpen && (
                  <th className="w-24 px-2 py-3 text-center text-[8px]">
                    Form
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {data.map((row, index) => {
                const isSelected = selectedTeamResults?.name === row.teamName;
                return (
                  <tr
                    key={row.teamId}
                    onClick={() => handleTeamClick(row.teamId, row.teamName)}
                    className={`cursor-pointer transition-colors group text-[11px] ${isSelected ? "bg-teal-500/15" : "hover:bg-teal-500/5"}`}
                  >
                    <td className="px-2 py-2 font-mono text-center text-gray-600">
                      {index + 1}
                    </td>
                    <td
                      className={`px-3 py-2 font-bold truncate transition-colors ${isSelected ? "text-teal-400" : "text-gray-300 group-hover:text-white"}`}
                    >
                      {row.teamName}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-500 font-mono text-[10px]">
                      {row.played}
                    </td>
                    {!isSidebarOpen && (
                      <>
                        <td className="px-2 py-2 text-center text-gray-500 font-mono text-[10px]">
                          {row.won}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-500 font-mono text-[10px]">
                          {row.drawn}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-500 font-mono text-[10px]">
                          {row.lost}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600 font-mono text-[10px]">
                          {row.gf}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600 font-mono text-[10px]">
                          {row.ga}
                        </td>
                      </>
                    )}
                    <td
                      className={`px-2 py-2 text-center font-mono text-[10px] ${row.gd > 0 ? "text-teal-600/60" : row.gd < 0 ? "text-red-900/60" : "text-gray-600"}`}
                    >
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-teal-400 bg-teal-500/5 font-mono text-[10px]">
                      {row.points}
                    </td>
                    {!isSidebarOpen && (
                      <td className="px-2 py-2">
                        <div className="flex justify-center gap-1">
                          {row.form
                            ?.slice(0, 5)
                            .map((result: string, i: number) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ${result === "W" ? "bg-teal-500" : result === "D" ? "bg-gray-500" : "bg-red-900"}`}
                              >
                                {result}
                              </span>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full lg:w-80 lg:shrink-0">
        {isSidebarOpen ? (
          <TeamResultsSidebar
            teamName={selectedTeamResults.name}
            matches={selectedTeamResults.matches}
            onClose={() => setSelectedTeamResults(null)}
          />
        ) : (
          <SeasonSummaryCard stats={seasonStats} />
        )}
      </div>
    </div>
  );
};
