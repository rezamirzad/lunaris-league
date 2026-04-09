import { Player, PlayerAttributes } from "@/app/models";
// Import the dictionary we created
import { PLAYER_NAME_DICTIONARY } from "../dictionaries/playerNameData";

const POSITION_CONFIG: Record<
  string,
  { primary: (keyof PlayerAttributes)[]; secondary: (keyof PlayerAttributes)[] }
> = {
  ST: { primary: ["pace", "shooting"], secondary: ["physical", "dribbling"] },
  CB: { primary: ["defending", "physical"], secondary: ["passing"] },
  CM: {
    primary: ["passing", "dribbling"],
    secondary: ["shooting", "defending"],
  },
  GK: { primary: ["physical", "defending"], secondary: ["passing"] },
};

export class PlayerGenerator {
  static generate(
    position: Player["position"],
    nationality_id: string,
    teamId: string,
    targetOvr: number,
  ): Player {
    // 1. Get the correct name pool based on nationality_id
    const pool =
      PLAYER_NAME_DICTIONARY[nationality_id] || PLAYER_NAME_DICTIONARY.DEFAULT;

    // 2. Pick names specifically from that pool
    const firstName =
      pool.firstNames[Math.floor(Math.random() * pool.firstNames.length)];
    const lastName =
      pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];

    const name = `${firstName} ${lastName}`;

    return {
      id: `p_${Math.random().toString(36).substring(2, 9)}`,
      teamId,
      name,
      position,
      ovr: targetOvr,
      currentElo: 1200,
      age: Math.floor(Math.random() * (23 - 17 + 1)) + 17,
      nationality_id: nationality_id as any,
      attributes: this.generateAttributes(position, targetOvr),
      history: [],
    };
  }

  private static generateAttributes(
    pos: string,
    ovr: number,
  ): PlayerAttributes {
    const config = POSITION_CONFIG[pos] || POSITION_CONFIG["CM"];

    const genStat = (isPrimary: boolean) => {
      const variance = isPrimary ? 40 : -20;
      return Math.min(
        990,
        Math.max(300, ovr + Math.floor(Math.random() * 50) + variance),
      );
    };

    const attributes: any = {
      pace: genStat(config.primary.includes("pace")),
      shooting: genStat(config.primary.includes("shooting")),
      passing: genStat(config.primary.includes("passing")),
      dribbling: genStat(config.primary.includes("dribbling")),
      defending: genStat(config.primary.includes("defending")),
      physical: genStat(config.primary.includes("physical")),
      playstyles: [],
      playstylePlus: "",
    };

    if (pos === "ST") attributes.playstylePlus = "Power Shot+";
    if (pos === "CB") attributes.playstylePlus = "Anticipate+";

    return attributes as PlayerAttributes;
  }
}
