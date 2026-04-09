import { Team, TeamTactics } from "@/app/models";
import { TEAM_NAME_DICTIONARY } from "../dictionaries/teamNameData";

export class TeamGenerator {
  private static tacticalArchetypes = [
    {
      style: "Positional Play",
      formation: "4-1-4-1",
      width: 45,
      depth: 75,
      buildUp: "Slow Build Up",
      chanceCreation: "Forward Runs",
    },
    {
      style: "Gegenpressing",
      formation: "4-3-3",
      width: 60,
      depth: 85,
      buildUp: "Fast Build Up",
      chanceCreation: "Direct Passing",
    },
    {
      style: "Counter-Attack",
      formation: "5-2-3",
      width: 40,
      depth: 30,
      buildUp: "Long Ball",
      chanceCreation: "Forward Runs",
    },
  ];

  /**
   * Generates a localized name based on nationality
   */
  private static generateLocalizedName(nationality_id: string): string {
    const data =
      TEAM_NAME_DICTIONARY[nationality_id] || TEAM_NAME_DICTIONARY.DEFAULT;
    const town = data.towns[Math.floor(Math.random() * data.towns.length)];
    const affix = data.affixes[Math.floor(Math.random() * data.affixes.length)];

    // Spanish teams often use Prefixes (Real Madrid),
    // English often use Suffixes (Manchester United).
    if (nationality_id === "ESP" && Math.random() > 0.3) {
      return `${affix} ${town}`;
    }

    // Default to Town + Affix
    return `${town} ${affix}`;
  }

  static generate(league_id: string, nationality_id: string): Team {
    // Generate the name internally using the dictionary
    const name = this.generateLocalizedName(nationality_id);

    // Pick a random tactical style for the new team
    const archetype =
      this.tacticalArchetypes[
        Math.floor(Math.random() * this.tacticalArchetypes.length)
      ];

    const tactics: TeamTactics = {
      ...archetype,
      width: archetype.width + (Math.floor(Math.random() * 11) - 5),
      depth: archetype.depth + (Math.floor(Math.random() * 11) - 5),
    };

    return {
      id: `t_${Math.random().toString(36).substring(2, 9)}`,
      name,
      league_id,
      elo_rating: 1200 + (Math.floor(Math.random() * 200) - 100),
      tactics,
      nationality_id,
    };
  }
}
