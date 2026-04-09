import { Player, PlayerPosition } from "@/app/models";
import { PLAYER_NAME_DICTIONARY } from "../dictionaries/playerNameData";

export class PlayerGenerator {
  private static getWeightedNationality(
    localNation: string,
    tier: number,
  ): string {
    const random = Math.random();

    // Tier 1 (Global): 40% Local, 40% Top Nations, 20% Random Global
    if (tier === 1) {
      if (random < 0.4) return localNation;
      if (random < 0.8) {
        const topNations = [
          "BRA",
          "ARG",
          "FRA",
          "ESP",
          "ENG",
          "GER",
          "POR",
          "ITA",
          "NED",
        ];
        return topNations[Math.floor(Math.random() * topNations.length)];
      }
      const allNations = Object.keys(PLAYER_NAME_DICTIONARY);
      return allNations[Math.floor(Math.random() * allNations.length)];
    }

    // Tier 2-3 (Regional): 70% Local, 20% Regional/Top, 10% Random
    if (tier <= 3) {
      if (random < 0.7) return localNation;
      return random < 0.9 ? "ENG" : "FRA";
    }

    // Tier 4+ (Local): 95% Local, 5% Random
    const allNations = Object.keys(PLAYER_NAME_DICTIONARY);
    return random < 0.95
      ? localNation
      : allNations[Math.floor(Math.random() * allNations.length)];
  }

  static generateSinglePlayer(
    teamId: string,
    teamElo: number,
    localNation: string,
    tier: number,
    position: PlayerPosition,
  ): Player {
    const eloOffset = (teamElo - 1000) / 40;
    const baseOverall = Math.floor(70 + eloOffset);
    const varianceRange = tier === 1 ? 14 : 8;
    const variance =
      Math.floor(Math.random() * varianceRange) - varianceRange / 2;
    const finalOvr = Math.min(94, Math.max(45, baseOverall + variance));
    const nation = this.getWeightedNationality(localNation, tier);

    return {
      id: crypto.randomUUID(),
      name: this.generateName(nation),
      age: Math.floor(Math.random() * (36 - 17 + 1)) + 17,
      position: position,
      ovr: finalOvr,
      teamId: teamId,
      nationality_id: nation,
      attributes: this.generateAttributes(finalOvr), // Generate the stats object
    } as any;
  }

  static generateSquad(
    teamId: string,
    teamElo: number,
    localNation: string,
    tier: number,
  ): Player[] {
    const squad: Player[] = [];
    const squadTemplate: { pos: PlayerPosition; count: number }[] = [
      { pos: "GK", count: 3 }, // +1 for depth
      { pos: "CB", count: 6 }, // +2 for depth
      { pos: "LB", count: 3 }, // +1
      { pos: "RB", count: 3 }, // +1
      { pos: "CDM", count: 3 }, // +1
      { pos: "CM", count: 5 }, // +2
      { pos: "CAM", count: 3 }, // +1
      { pos: "LM", count: 2 }, // +1
      { pos: "RM", count: 2 }, // +1
      { pos: "ST", count: 5 }, // +2
    ];

    squadTemplate.forEach(({ pos, count }) => {
      for (let i = 0; i < count; i++) {
        squad.push(
          this.generateSinglePlayer(teamId, teamElo, localNation, tier, pos),
        );
      }
    });

    return squad;
  }

  static generateName(nationality_id: string): string {
    const dict =
      PLAYER_NAME_DICTIONARY[nationality_id] || PLAYER_NAME_DICTIONARY["ENG"];
    const first =
      dict.firstNames[Math.floor(Math.random() * dict.firstNames.length)];
    const last =
      dict.lastNames[Math.floor(Math.random() * dict.lastNames.length)];
    return `${first} ${last}`;
  }

  // frontend/src/lib/generators/PlayerGenerator.ts

  private static generateAttributes(ovr: number) {
    // Generates 6 core attributes centered around the player's OVR
    const vary = () =>
      Math.min(99, Math.max(30, ovr + (Math.floor(Math.random() * 12) - 6)));

    return {
      pac: vary(), // Pace
      sho: vary(), // Shooting
      pas: vary(), // Passing
      dri: vary(), // Dribbling
      def: vary(), // Defending
      phy: vary(), // Physical
    };
  }
}
