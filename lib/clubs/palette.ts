// Club kit colors keyed by short code. getClubPalette below normalizes
// whatever string arrives from the players table.

export type ClubPalette = {
  short: string;
  name: string;
  primary: string;
  secondary: string;
  text: string;
};

export const CLUB_PALETTES: Record<string, ClubPalette> = {
  ARS: { short: "ARS", name: "Arsenal", primary: "#EF0107", secondary: "#FFFFFF", text: "#FFFFFF" },
  AVL: { short: "AVL", name: "Aston Villa", primary: "#670E36", secondary: "#95BFE5", text: "#FFFFFF" },
  BOU: { short: "BOU", name: "Bournemouth", primary: "#DA291C", secondary: "#000000", text: "#FFFFFF" },
  BRE: { short: "BRE", name: "Brentford", primary: "#E30613", secondary: "#FFFFFF", text: "#FFFFFF" },
  BHA: { short: "BHA", name: "Brighton", primary: "#0057B8", secondary: "#FFCD00", text: "#FFFFFF" },
  BUR: { short: "BUR", name: "Burnley", primary: "#6C1D45", secondary: "#99D6EA", text: "#FFFFFF" },
  CHE: { short: "CHE", name: "Chelsea", primary: "#034694", secondary: "#FFFFFF", text: "#FFFFFF" },
  CRY: { short: "CRY", name: "Crystal Palace", primary: "#1B458F", secondary: "#C4122E", text: "#FFFFFF" },
  EVE: { short: "EVE", name: "Everton", primary: "#003399", secondary: "#FFFFFF", text: "#FFFFFF" },
  FUL: { short: "FUL", name: "Fulham", primary: "#FFFFFF", secondary: "#000000", text: "#000000" },
  IPS: { short: "IPS", name: "Ipswich Town", primary: "#3764A6", secondary: "#FFFFFF", text: "#FFFFFF" },
  LEI: { short: "LEI", name: "Leicester City", primary: "#003090", secondary: "#FDBE11", text: "#FFFFFF" },
  LEE: { short: "LEE", name: "Leeds United", primary: "#FFCD00", secondary: "#1D437B", text: "#1D437B" },
  LIV: { short: "LIV", name: "Liverpool", primary: "#C8102E", secondary: "#00B2A9", text: "#FFFFFF" },
  MCI: { short: "MCI", name: "Manchester City", primary: "#6CABDD", secondary: "#FFFFFF", text: "#FFFFFF" },
  MUN: { short: "MUN", name: "Manchester United", primary: "#DA291C", secondary: "#FBE122", text: "#FFFFFF" },
  NEW: { short: "NEW", name: "Newcastle United", primary: "#241F20", secondary: "#FFFFFF", text: "#FFFFFF" },
  NFO: { short: "NFO", name: "Nottingham Forest", primary: "#DD0000", secondary: "#FFFFFF", text: "#FFFFFF" },
  SOU: { short: "SOU", name: "Southampton", primary: "#D71920", secondary: "#FFC20E", text: "#FFFFFF" },
  TOT: { short: "TOT", name: "Tottenham Hotspur", primary: "#132257", secondary: "#FFFFFF", text: "#FFFFFF" },
  WHU: { short: "WHU", name: "West Ham United", primary: "#7A263A", secondary: "#1BB1E7", text: "#FFFFFF" },
  WOL: { short: "WOL", name: "Wolves", primary: "#FDB913", secondary: "#231F20", text: "#231F20" },
};

const ALIASES: Record<string, string> = {
  arsenal: "ARS",
  "aston villa": "AVL",
  bournemouth: "BOU",
  brentford: "BRE",
  brighton: "BHA",
  "brighton & hove albion": "BHA",
  burnley: "BUR",
  chelsea: "CHE",
  "crystal palace": "CRY",
  everton: "EVE",
  fulham: "FUL",
  ipswich: "IPS",
  "ipswich town": "IPS",
  leicester: "LEI",
  "leicester city": "LEI",
  leeds: "LEE",
  "leeds united": "LEE",
  liverpool: "LIV",
  "manchester city": "MCI",
  "man city": "MCI",
  "manchester united": "MUN",
  "man united": "MUN",
  "man utd": "MUN",
  newcastle: "NEW",
  "newcastle united": "NEW",
  "nottingham forest": "NFO",
  forest: "NFO",
  southampton: "SOU",
  tottenham: "TOT",
  "tottenham hotspur": "TOT",
  spurs: "TOT",
  "west ham": "WHU",
  "west ham united": "WHU",
  wolves: "WOL",
  wolverhampton: "WOL",
};

const FALLBACK: ClubPalette = {
  short: "—",
  name: "Unknown",
  primary: "#1f2740",
  secondary: "#d4b676",
  text: "#f4f6fb",
};

/** Resolve a club palette from a free-form club string or short code. */
export function getClubPalette(input?: string | null): ClubPalette {
  if (!input) return FALLBACK;
  const trimmed = input.trim();
  if (!trimmed) return FALLBACK;
  const upper = trimmed.toUpperCase();
  if (CLUB_PALETTES[upper]) return CLUB_PALETTES[upper];
  const aliased = ALIASES[trimmed.toLowerCase()];
  if (aliased && CLUB_PALETTES[aliased]) return CLUB_PALETTES[aliased];
  return FALLBACK;
}
