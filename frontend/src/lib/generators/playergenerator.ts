import { Player, PlayerAttributes } from "@/app/models";

// Archetypes define which stats are "Primary" for a position
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
  GK: { primary: ["physical", "defending"], secondary: ["passing"] }, // Using defending as a proxy for reflexes
};

export class PlayerGenerator {
  private static firstNames = [
    "Lamine",
    "Erling",
    "Jude",
    "Kylian",
    "Florian",
    "Kobbie",
    "Pau",
    "Bukayo",
  ];
  private static lastNames = [
    "Yamal",
    "Haaland",
    "Bellingham",
    "Mbappé",
    "Wirtz",
    "Mainoo",
    "Cubarsí",
    "Saka",
  ];

  static generate(
    position: Player["position"],
    nationality_id: string, // ISO code string as per your DB
    teamId: string,
    targetOvr: number,
  ): Player {
    const name = `${this.firstNames[Math.floor(Math.random() * this.firstNames.length)]} ${this.lastNames[Math.floor(Math.random() * this.lastNames.length)]}`;

    return {
      id: `p_${Math.random().toString(36).substring(2, 9)}`,
      teamId,
      name,
      position,
      ovr: targetOvr,
      currentElo: 1200,
      age: Math.floor(Math.random() * (23 - 17 + 1)) + 17, // Generates youth/wonderkids
      nationality_id: nationality_id as any, // Cast to any if your interface strictly requires number
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

    // Assign basic playstyle logic
    if (pos === "ST") attributes.playstylePlus = "Power Shot+";
    if (pos === "CB") attributes.playstylePlus = "Anticipate+";

    return attributes as PlayerAttributes;
  }
}
