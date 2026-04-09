
import { Player } from "../models";

// Helper to get flag URL from 3-letter ISO
const getFlagUrl = (iso3: string) => {
  // Basic mapping for common football nations - FlagCDN uses 2-letter codes
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
  };
  const code = mapping[iso3] || iso3.substring(0, 2).toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
};

export const PlayerCard = ({ player }: { player: Player }) => {
  return (
    <div
      key={player.id}
      className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex justify-between items-center hover:border-teal-500 transition-colors group"
    >
      <div className="flex items-center gap-4">
        {/* Flag Display */}
        <div className="w-10 h-7 relative flex-shrink-0">
          <img
            src={getFlagUrl(player.nationality_id)}
            alt={player.nationality_id}
            className="rounded-sm object-cover border border-gray-700"
            onError={(e) =>
              (e.currentTarget.src = "https://flagcdn.com/w40/un.png")
            }
          />
        </div>

        <div>
          <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">
            {player.position}
          </p>
          <h3 className="text-lg font-bold group-hover:text-teal-400 transition-colors">
            {player.name}
          </h3>
          <p className="text-gray-500 text-xs">
            Age: {player.age} • {player.nationality_id}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-3xl font-black italic text-gray-200">
          {Math.floor(player.ovr / 10)}
        </span>
        <p className="text-[10px] text-gray-600 font-bold uppercase">
          OVR
        </p>
      </div>

      <div className="text-right">
        <span className="text-3xl font-black italic text-gray-200">
          {player.attributes?.dribbling
            ? Math.floor(player.attributes.dribbling / 10)
            : "?"}
        </span>
        <p className="text-[10px] text-gray-600 font-bold uppercase">
          Dribbling
        </p>
      </div>
    </div>
  );
};
