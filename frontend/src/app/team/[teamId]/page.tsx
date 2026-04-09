import { getTeamAndPlayersAction } from "@/app/actions/dbActions";
import FlagImage from "@/app/components/FlagImage";
import { PlayerCard } from "@/app/components/PlayerCard";
import { TeamCard } from "@/app/components/TeamCard";
import { Player, Team } from "@/app/models";

export default async function TeamPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { team, players } = await getTeamAndPlayersAction(params.teamId);

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-black text-white">
        <h1 className="text-4xl font-bold">Team not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-10 bg-black text-white">
      <main className="w-full max-w-4xl px-10">
        <TeamCard team={team as Team} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {players.map((player: Player) => (
            <PlayerCard player={player} key={player.id} />
          ))}
        </div>
      </main>
    </div>
  );
}
