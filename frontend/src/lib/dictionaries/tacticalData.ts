// frontend/src/lib/dictionaries/tacticalData.ts

export const TACTICAL_ARCHETYPES = [
  // --- POSSESSION BASED ---
  {
    style: "Positional Play",
    formation: "4-1-4-1",
    width: 45,
    depth: 75,
    buildUp: "Slow Build Up",
    chanceCreation: "Forward Runs",
  },
  {
    style: "Tiki-Taka",
    formation: "4-3-3 Holding",
    width: 40,
    depth: 70,
    buildUp: "Slow Build Up",
    chanceCreation: "Possession",
  },
  {
    style: "Total Football",
    formation: "4-3-3 Attack",
    width: 70,
    depth: 80,
    buildUp: "Fast Build Up",
    chanceCreation: "Forward Runs",
  },

  // --- PRESSING & AGGRESSIVE ---
  {
    style: "Gegenpressing",
    formation: "4-3-3",
    width: 60,
    depth: 85,
    buildUp: "Fast Build Up",
    chanceCreation: "Direct Passing",
  },
  {
    style: "Vertical Tiki-Taka",
    formation: "4-2-3-1",
    width: 50,
    depth: 65,
    buildUp: "Fast Build Up",
    chanceCreation: "Direct Passing",
  },
  {
    style: "High Line Overload",
    formation: "3-4-3",
    width: 75,
    depth: 90,
    buildUp: "Fast Build Up",
    chanceCreation: "Forward Runs",
  },

  // --- DEFENSIVE & COUNTER ---
  {
    style: "Counter-Attack",
    formation: "5-2-3",
    width: 40,
    depth: 30,
    buildUp: "Long Ball",
    chanceCreation: "Forward Runs",
  },
  {
    style: "Park the Bus",
    formation: "5-4-1",
    width: 30,
    depth: 20,
    buildUp: "Long Ball",
    chanceCreation: "Direct Passing",
  },
  {
    style: "Catennacio",
    formation: "5-3-2",
    width: 35,
    depth: 25,
    buildUp: "Balanced",
    chanceCreation: "Forward Runs",
  },
  {
    style: "Low Block Stopper",
    formation: "4-4-2 Holding",
    width: 35,
    depth: 35,
    buildUp: "Long Ball",
    chanceCreation: "Direct Passing",
  },

  // --- DIRECT & PHYSICAL ---
  {
    style: "Route 1",
    formation: "4-4-2 Diamond",
    width: 55,
    depth: 40,
    buildUp: "Long Ball",
    chanceCreation: "Direct Passing",
  },
  {
    style: "Wing Play",
    formation: "4-4-2",
    width: 80,
    depth: 60,
    buildUp: "Balanced",
    chanceCreation: "Wide Crosses",
  },
  {
    style: "Cross & Hope",
    formation: "4-2-4",
    width: 90,
    depth: 55,
    buildUp: "Balanced",
    chanceCreation: "Wide Crosses",
  },

  // --- MODERN HYBRIDS ---
  {
    style: "False Nine System",
    formation: "4-3-3 False 9",
    width: 50,
    depth: 65,
    buildUp: "Slow Build Up",
    chanceCreation: "Possession",
  },
  {
    style: "Box Midfield",
    formation: "3-2-2-3",
    width: 45,
    depth: 70,
    buildUp: "Slow Build Up",
    chanceCreation: "Forward Runs",
  },
];
