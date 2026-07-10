export const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type Position = (typeof POSITIONS)[number];

export const PREMIER_CLUBS = [
  { id: "ars", name: "Arsenal" },
  { id: "avl", name: "Aston Villa" },
  { id: "bou", name: "Bournemouth" },
  { id: "bre", name: "Brentford" },
  { id: "bri", name: "Brighton" },
  { id: "che", name: "Chelsea" },
  { id: "cry", name: "Crystal Palace" },
  { id: "eve", name: "Everton" },
  { id: "ful", name: "Fulham" },
  { id: "ips", name: "Ipswich Town" },
  { id: "lei", name: "Leicester City" },
  { id: "liv", name: "Liverpool" },
  { id: "mci", name: "Man City" },
  { id: "mun", name: "Man Utd" },
  { id: "new", name: "Newcastle" },
  { id: "nfo", name: "Nott'm Forest" },
  { id: "sou", name: "Southampton" },
  { id: "tot", name: "Tottenham" },
  { id: "whu", name: "West Ham" },
  { id: "wol", name: "Wolves" },
] as const;
