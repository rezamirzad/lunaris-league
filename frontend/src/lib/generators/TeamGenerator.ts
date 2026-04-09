import { Team, TeamTactics } from "@/app/models";
import { TEAM_NAME_DICTIONARY } from "../dictionaries/teamNameData";
import { TACTICAL_ARCHETYPES } from "../dictionaries/tacticalData";

export class TeamGenerator {
  /**
   * Generates a localized name based on nationality and complex patterns
   */
  private static generateLocalizedName(nationality_id: string): string {
    const data =
      TEAM_NAME_DICTIONARY[nationality_id] || TEAM_NAME_DICTIONARY.DEFAULT;

    // Safely access arrays from the expanded dictionary
    const towns = data.towns;
    const affixes = data.affixes || []; // Prefixes (e.g., "Real")
    const suffixes = data.suffixes || []; // Suffixes (e.g., "United")

    const town = towns[Math.floor(Math.random() * towns.length)];
    const roll = Math.random();

    // 1. Pattern for Spanish Teams (Heavy focus on Prefixes)
    if (nationality_id === "ESP") {
      if (roll < 0.6) return `${this.getRandom(affixes)} ${town}`; // e.g., Real Madrid
      if (roll < 0.9) return `${town} ${this.getRandom(suffixes)}`; // e.g., Barcelona CF
      return `${this.getRandom(affixes)} ${town} ${this.getRandom(suffixes)}`; // e.g., Real Madrid CF
    }

    // 2. Pattern for English Teams (Heavy focus on Suffixes)
    if (nationality_id === "ENG") {
      if (roll < 0.7) return `${town} ${this.getRandom(suffixes)}`; // e.g., Manchester United
      if (roll < 0.9) return `${this.getRandom(affixes)} ${town}`; // e.g., AFC Bournemouth
      return `${this.getRandom(affixes)} ${town} ${this.getRandom(suffixes)}`; // e.g., AFC London United
    }

    // 3. Default / Generic Pattern
    if (roll < 0.45) return `${town} ${this.getRandom(suffixes || affixes)}`;
    if (roll < 0.9) return `${this.getRandom(affixes)} ${town}`;
    return `${this.getRandom(affixes)} ${town} ${this.getRandom(suffixes || affixes)}`;
  }

  /**
   * Helper to pick a random item from an array safely
   */
  private static getRandom(arr: string[]): string {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Picks a base archetype and applies variance to create a unique tactical profile
   */
  private static generateUniqueTactic(): TeamTactics {
    const base =
      TACTICAL_ARCHETYPES[
        Math.floor(Math.random() * TACTICAL_ARCHETYPES.length)
      ];

    // Apply a +/- 15 variance to width and depth for 500+ possible variations
    return {
      style: base.style,
      formation: base.formation,
      width: Math.min(
        100,
        Math.max(1, base.width + (Math.floor(Math.random() * 31) - 15)),
      ),
      depth: Math.min(
        100,
        Math.max(1, base.depth + (Math.floor(Math.random() * 31) - 15)),
      ),
      buildUp: base.buildUp,
      chanceCreation: base.chanceCreation,
    };
  }

  /**
   * Main entry point to generate a complete Team object
   */
  static generate(league_id: string, nationality_id: string): Team {
    const name = this.generateLocalizedName(nationality_id);
    const tactics = this.generateUniqueTactic();

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
