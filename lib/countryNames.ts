/**
 * Maps common abbreviations/alt-names that news sources and GDELT's location
 * gazetteer use (e.g. "DRC", "UK", "USA") to the fuller English name used by
 * Mapbox's country-boundaries tileset, so a country's tracked events match
 * up with the polygon the user clicks. Case-insensitive lookup; unrecognized
 * names pass through unchanged.
 */
const ALIASES: Record<string, string> = {
  drc: "Democratic Republic of the Congo",
  "dr congo": "Democratic Republic of the Congo",
  "congo-kinshasa": "Democratic Republic of the Congo",
  "congo dr": "Democratic Republic of the Congo",
  "republic of congo": "Republic of the Congo",
  "congo-brazzaville": "Republic of the Congo",
  usa: "United States of America",
  us: "United States of America",
  "u.s.": "United States of America",
  "u.s.a.": "United States of America",
  "united states": "United States of America",
  america: "United States of America",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  dprk: "North Korea",
  "north korea": "North Korea",
  rok: "South Korea",
  prc: "China",
  "ivory coast": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  burma: "Myanmar",
  swaziland: "Eswatini",
  macedonia: "North Macedonia",
  "czech republic": "Czechia",
  "east timor": "Timor-Leste",
  "palestinian territories": "Palestine",
  "west bank and gaza": "Palestine",
};

export function canonicalCountryName(raw: string): string {
  const trimmed = raw.trim();
  return ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
