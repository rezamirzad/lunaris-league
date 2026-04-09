// Dictionary for team name generation
export const TEAM_NAME_DICTIONARY: Record<
  string,
  { towns: string[]; affixes: string[] }
> = {
  ENG: {
    towns: [
      "London",
      "Manchester",
      "Liverpool",
      "Birmingham",
      "Leeds",
      "Newcastle",
      "Sheffield",
      "Bristol",
    ],
    affixes: [
      "United",
      "City",
      "Town",
      "Rovers",
      "Wanderers",
      "Athletic",
      "FC",
      "Albion",
    ],
  },
  ESP: {
    towns: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Seville",
      "Bilbao",
      "Vigo",
      "Granada",
      "Malaga",
    ],
    affixes: ["Real", "CF", "Atletico", "Deportivo", "Union", "Sporting", "SD"],
  },
  NOR: {
    towns: [
      "Oslo",
      "Bergen",
      "Trondheim",
      "Stavanger",
      "Drammen",
      "Fredrikstad",
      "Bodø",
      "Molde",
    ],
    affixes: ["FK", "IL", "Ballklubb", "Fotball", "Glimt", "Viking"],
  },
  IRN: {
    towns: [
      "Tehran",
      "Isfahan",
      "Mashhad",
      "Tabriz",
      "Shiraz",
      "Ahvaz",
      "Abadan",
      "Kerman",
    ],
    affixes: ["SC", "FC", "United", "Steel", "Pas", "Shahr", "Shahid"],
  },
  DEFAULT: {
    towns: [
      "Global",
      "Central",
      "North",
      "South",
      "East",
      "West",
      "Metro",
      "Port",
    ],
    affixes: [
      "Stars",
      "League",
      "Football Club",
      "Strikers",
      "Titans",
      "Elite",
    ],
  },
};
