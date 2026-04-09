"use client";

import { LeagueTableEntry } from "../models";

interface LeagueTableProps {
  data: LeagueTableEntry[];
  title?: string;
}

export const LeagueTableCard = ({ data, title }: LeagueTableProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {title && (
        <h2 className="text-xl font-bold mb-4 text-teal-500 uppercase tracking-tight italic border-l-8 border-teal-500 pl-3">
          {title}
        </h2>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 shadow-xl">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-800/50 text-gray-500 uppercase text-[9px] font-black tracking-widest border-b border-gray-800">
              <th className="w-10 px-3 py-2 text-center">#</th>
              <th className="w-auto px-3 py-2">Team</th>
              <th className="w-10 px-2 py-2 text-center">P</th>
              <th className="w-10 px-2 py-2 text-center">W</th>
              <th className="w-10 px-2 py-2 text-center">D</th>
              <th className="w-10 px-2 py-2 text-center">L</th>
              <th className="w-12 px-2 py-2 text-center">GF</th>
              <th className="w-12 px-2 py-2 text-center">GA</th>
              <th className="w-12 px-2 py-2 text-center">GD</th>
              <th className="w-14 px-3 py-2 text-center text-teal-400">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30">
            {data.map((row, index) => {
              const isTopFour = index < 4;
              const isRelegation = index >= data.length - 3;

              return (
                <tr
                  key={row.teamId}
                  className="hover:bg-teal-500/5 transition-colors group text-xs"
                >
                  <td
                    className={`px-3 py-1.5 font-mono text-center ${
                      isTopFour
                        ? "text-teal-500 font-bold"
                        : isRelegation
                          ? "text-red-500"
                          : "text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5 truncate">
                    <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {row.teamName}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-400">
                    {row.played}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-400">
                    {row.won}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-400">
                    {row.drawn}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-400">
                    {row.lost}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-500 font-mono">
                    {row.gf}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-500 font-mono">
                    {row.ga}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-center font-mono ${
                      row.gd > 0
                        ? "text-teal-600/80"
                        : row.gd < 0
                          ? "text-red-600/80"
                          : "text-gray-500"
                    }`}
                  >
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-teal-400 bg-teal-500/5">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
