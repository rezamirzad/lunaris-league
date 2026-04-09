"use client";

export const SeasonSummaryCard = ({ stats }: { stats: any }) => {
  if (!stats) return null;

  const rowClass =
    "border-b border-gray-800/50 hover:bg-white/5 transition-colors";
  const labelClass =
    "py-2.5 pr-4 text-gray-500 font-bold text-[10px] uppercase tracking-wider w-1/3";
  const valueClass =
    "py-2.5 text-gray-200 text-[11px] text-right font-medium leading-tight";

  return (
    <div className="w-full max-w-sm bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-xs font-black text-teal-500 uppercase italic tracking-widest">
          Season Summary
        </h3>
        <span className="text-[9px] text-gray-600 font-mono italic">
          Wikipedia Style
        </span>
      </div>

      <div className="p-4">
        <table className="w-full border-collapse">
          <tbody>
            <tr className={rowClass}>
              <td className={labelClass}>Total Matches</td>
              <td className={valueClass}>{stats.totalMatches}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Total Goals</td>
              <td className={valueClass}>
                {stats.totalGoals}{" "}
                <span className="text-gray-600 ml-1">
                  ({stats.goalsPerMatch}/m)
                </span>
              </td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Top Goalscorer</td>
              <td className={valueClass}>{stats.topScorer}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Biggest Home Win</td>
              <td className={valueClass}>{stats.biggestHomeWin}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Biggest Away Win</td>
              <td className={valueClass}>{stats.biggestAwayWin}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Highest Scoring</td>
              <td className={valueClass}>{stats.highestScoring}</td>
            </tr>

            {/* Wikipedia Streak Stats */}
            <tr className={rowClass}>
              <td className={labelClass}>Longest Winning Run</td>
              <td className={valueClass}>{stats.winningRun}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Longest Unbeaten Run</td>
              <td className={valueClass}>{stats.unbeatenRun}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Longest Winless Run</td>
              <td className={valueClass}>{stats.winlessRun}</td>
            </tr>
            <tr className={rowClass}>
              <td className={labelClass}>Longest Losing Run</td>
              <td className={valueClass}>{stats.losingRun}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
