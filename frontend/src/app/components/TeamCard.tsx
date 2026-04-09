"use client";

import { Team } from "../models";

export const TeamCard = ({ team }: { team: Team }) => {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-6xl font-bold mb-2 tracking-tighter">{team.name}</h1>
      <p className="text-gray-500">
        {team.league_id} • Elo: {team.elo_rating}
      </p>
    </div>
  );
};
