import type { ConflictEvent, Severity } from "./types";
import { dominantSeverityOf } from "./countryStats";

export const RISK_FILL_COLOR: Record<Severity, string> = {
  low: "#39ff88",
  medium: "#f4ff45",
  high: "#ff9f1c",
  critical: "#ff2d55",
};

export const DEFAULT_RISK_FILL_COLOR = RISK_FILL_COLOR.low;

/**
 * Maps each country with at least one tracked event to a fill color based on
 * its dominant severity. Countries with no tracked events are left out —
 * callers should fall back to DEFAULT_RISK_FILL_COLOR (the "calm" baseline)
 * for everything not in this map.
 */
export function computeCountryFillColors(events: ConflictEvent[]): Record<string, string> {
  const byCountry = new Map<string, ConflictEvent[]>();

  for (const event of events) {
    const list = byCountry.get(event.country) ?? [];
    list.push(event);
    byCountry.set(event.country, list);
  }

  const colors: Record<string, string> = {};
  for (const [country, list] of byCountry) {
    colors[country] = RISK_FILL_COLOR[dominantSeverityOf(list)];
  }
  return colors;
}
