export const TIER_ELO_MAP: Record<
  number,
  { min: number; max: number; average: number }
> = {
  1: { min: 1800, max: 2200, average: 2000 }, // Elite (Premier League / La Liga)
  2: { min: 1550, max: 1900, average: 1725 }, // High Pro (Championship / Segunda)
  3: { min: 1350, max: 1650, average: 1500 }, // Pro (League One)
  4: { min: 1150, max: 1450, average: 1300 }, // Low Pro (League Two)
  5: { min: 1000, max: 1250, average: 1125 }, // Semi-Pro (National League)
  6: { min: 850, max: 1100, average: 975 }, // Regional Semi-Pro
  7: { min: 700, max: 950, average: 825 }, // High Amateur
  8: { min: 550, max: 800, average: 675 }, // Amateur
  9: { min: 400, max: 650, average: 525 }, // Low Amateur
  10: { min: 200, max: 500, average: 350 }, // Grassroots / Local
};

export const NATION_ELO_MODIFIER: Record<string, number> = {
  ENG: 1.05, // Top Coefficient (+5%)
  ESP: 1.03, // (+3%)
  GER: 1.0, // Baseline
  ITA: 1.0,
  FRA: 0.95, // (-5%)
  NOR: 0.85, // (-15%)
  IRN: 0.8, // (-20%)
  DEFAULT: 0.75, // Generic fallback for new nations
};
