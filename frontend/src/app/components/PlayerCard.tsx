"use client";

import { Player } from "../models";

// Improved helper to handle more ISO3 codes
const getFlagUrl = (iso3: string) => {
  const mapping: Record<string, string> = {
    NOR: "no",
    ESP: "es",
    ENG: "gb",
    FRA: "fr",
    GER: "de",
    ITA: "it",
    ARG: "ar",
    BRA: "br",
    POR: "pt",
    NED: "nl",
    IRN: "ir",
    USA: "us",
    JPN: "jp",
    MEX: "mx",
  };
  const code = mapping[iso3] || iso3.substring(0, 2).toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
};

interface PlayerCardProps {
  player: Player;
  teamDetails?: { name: string; nation: string }; // Optional prop
}

export const PlayerCard = ({ player, teamDetails }: PlayerCardProps) => {
  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex justify-between items-center hover:border-teal-500 transition-all group shadow-lg">
      <div className="flex items-center gap-4">
        {/* Player's Nationality Flag */}
        <div className="flex flex-col items-center gap-1">
          <img
            src={getFlagUrl(player.nationality_id)}
            alt={player.nationality_id}
            className="w-8 h-5 rounded-sm object-cover border border-gray-800"
            title={`Player Nation: ${player.nationality_id}`}
          />
          <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">
            {player.position}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold group-hover:text-teal-400 transition-colors leading-tight">
            {player.name}
          </h3>

          {/* Team Info Row */}
          <div className="flex items-center gap-2 mt-1">
            {teamDetails && (
              <img
                src={getFlagUrl(teamDetails.nation)}
                className="w-4 h-2.5 opacity-70"
                alt="Team Nation"
              />
            )}
            <p className="text-gray-400 text-xs font-medium">
              {teamDetails?.name || player.teamId}
            </p>
          </div>

          <p className="text-gray-500 text-[10px] mt-0.5">
            Age: {player.age} • {player.nationality_id}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-3xl font-black italic text-gray-200 leading-none">
          {Math.floor(player.ovr / 10)}
        </span>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
          OVR
        </p>
      </div>
    </div>
  );
};
