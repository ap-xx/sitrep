import { describe, expect, it } from "vitest";
import { computeCountryFillColors, RISK_FILL_COLOR } from "./countryRisk";
import type { ConflictEvent } from "./types";

function makeEvent(overrides: Partial<ConflictEvent>): ConflictEvent {
  return {
    id: "id",
    lat: 0,
    lng: 0,
    locationName: "Somewhere",
    country: "Testland",
    headline: "headline",
    source: "GDELT",
    sourceUrl: "",
    timestamp: "2026-08-10T00:00:00.000Z",
    severity: "low",
    confidence: 50,
    ...overrides,
  };
}

describe("computeCountryFillColors", () => {
  it("returns no entry for countries with no events", () => {
    expect(computeCountryFillColors([])).toEqual({});
  });

  it("maps a country to its dominant severity's color", () => {
    const events = [
      makeEvent({ country: "Yemen", severity: "low" }),
      makeEvent({ country: "Yemen", severity: "critical" }),
    ];

    const colors = computeCountryFillColors(events);

    expect(colors.Yemen).toBe(RISK_FILL_COLOR.critical);
  });

  it("computes independent colors per country", () => {
    const events = [
      makeEvent({ country: "A", severity: "low" }),
      makeEvent({ country: "B", severity: "high" }),
    ];

    const colors = computeCountryFillColors(events);

    expect(colors.A).toBe(RISK_FILL_COLOR.low);
    expect(colors.B).toBe(RISK_FILL_COLOR.high);
  });
});
