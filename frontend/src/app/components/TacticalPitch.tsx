// src/components/TacticalPitch.tsx
"use client";

interface Player {
  id: string;
  name: string;
  position: string;
  ovr: number;
  coords: { x: number; y: number };
}

interface TacticalPitchProps {
  teamName: string;
  formation: string;
  players: Player[];
  resultEvents?: any[]; // For post-match visualization (optional)
  isHome: boolean;
}

export function TacticalPitch({
  teamName,
  formation,
  players,
  resultEvents,
  isHome,
}: TacticalPitchProps) {
  return (
    <div className="bg-gray-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
      {/* 1. Header & Formation Badge */}
      <div className="flex justify-between items-center border-b border-white/10 pb-5 mb-8 relative z-10">
        <div>
          <h3
            className={`text-sm font-black uppercase tracking-widest ${isHome ? "text-teal-500" : "text-blue-500"}`}
          >
            {isHome ? "Home" : "Away"} Formation
          </h3>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {teamName}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block">
            System
          </span>
          <span className="text-2xl font-black text-white italic leading-none">
            {formation}
          </span>
        </div>
      </div>

      {/* 2. CSS Football Pitch */}
      <div className="relative aspect-[3/4] bg-green-950/30 border-2 border-white/10 rounded-2xl overflow-hidden shadow-inner">
        {/* Pitch Lines */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 border-t-2 border-white/10" />{" "}
        {/* Halfway line */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-[18.75%] border-2 border-white/10 rounded-full" />{" "}
        {/* Center circle */}
        <div className="absolute inset-x-[15%] top-0 h-[18.75%] border-x-2 border-b-2 border-white/10" />{" "}
        {/* Penalty area */}
        <div className="absolute inset-x-[30%] top-0 h-[6.25%] border-x-2 border-b-2 border-white/10" />{" "}
        {/* Goal area */}
        <div className="absolute left-1/2 bottom-[1.25%] -translate-x-1/2 w-[2.5%] h-[1.875%] bg-white/10 rounded-full" />{" "}
        {/* Penalty spot */}
        {/* 3. Player Placement Grid */}
        <div className="absolute inset-x-0 inset-y-[2.5%]">
          {players.map((p) => {
            // Check for match events (cards/goals)
            const pEvents =
              resultEvents?.filter((e) => e.playerId === p.id) || [];
            const goals = pEvents.filter((e) => e.type === "GOAL").length;
            const hasYellow = pEvents.some((e) => e.type === "YELLOW");
            const isSentOff = pEvents.some((e) => e.type === "RED");

            return (
              <div
                key={p.id}
                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 group z-20"
                style={{
                  left: `${p.coords.x}%`,
                  top: `${100 - p.coords.y}%`, // We invert Y because CSS top is from the top, our Y is from the bottom
                }}
              >
                {/* Player Icon/Jersey */}
                <div
                  className={`relative flex items-center justify-center aspect-square rounded-full border-2 transition-all duration-300 ${
                    isSentOff
                      ? "opacity-20 grayscale border-red-900"
                      : goals > 0
                        ? "bg-teal-500 border-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.6)]"
                        : "bg-gray-800 border-gray-600 group-hover:border-white"
                  }`}
                >
                  <span
                    className={`text-sm font-black ${goals > 0 ? "text-black" : "text-white"}`}
                  >
                    {p.ovr}
                  </span>

                  {/* 1. Yellow Card Overlay (Only if not sent off) */}
                  {hasYellow && !isSentOff && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-yellow-400/30 backdrop-blur-[1px] animate-in zoom-in border border-yellow-400/50">
                      <span className="text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        🟨
                      </span>
                    </div>
                  )}

                  {/* 2. Red Card Overlay */}
                  {isSentOff && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-red-600/40 backdrop-blur-[1px] animate-in zoom-in border border-red-600/50">
                      <span className="text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        🟥
                      </span>
                    </div>
                  )}
                </div>

                {/* Player Name Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/70 border border-white/5 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap min-w-full text-center">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-tight group-hover:text-white transition-colors ${
                      isSentOff ? "text-red-900 line-through" : "text-gray-300"
                    }`}
                  >
                    {p.name.split(" ").pop()}{" "}
                    {/* Show only last name for brevity */}
                  </span>
                  {/* Goal markers */}
                  {Array.from({ length: goals }).map((_, i) => (
                    <span key={i} className="text-[7px] ml-1">
                      ⚽
                    </span>
                  ))}
                </div>

                {/* Tactical Position Flag (faded) */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-white/20 uppercase tracking-widest z-0 pointer-events-none">
                  {p.position}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
