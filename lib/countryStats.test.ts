import { describe, expect, it } from "vitest";
import { computeCountryStats } from "./countryStats";
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

describe("computeCountryStats", () => {
  it("returns zero count and null severity when no events match the country", () => {
    const stats = computeCountryStats([makeEvent({ country: "Otherland" })], "Testland");
    expect(stats).toEqual({ eventCount: 0, dominantSeverity: null });
  });

  it("counts only events matching the country, case-insensitively", () => {
    const events = [
      makeEvent({ country: "testland", severity: "low" }),
      makeEvent({ country: "TESTLAND", severity: "medium" }),
      makeEvent({ country: "Otherland", severity: "critical" }),
    ];
    const stats = computeCountryStats(events, "Testland");
    expect(stats.eventCount).toBe(2);
  });

  it("reports the highest severity present as dominant", () => {
    const events = [
      makeEvent({ country: "Testland", severity: "low" }),
      makeEvent({ country: "Testland", severity: "critical" }),
      makeEvent({ country: "Testland", severity: "medium" }),
    ];
    const stats = computeCountryStats(events, "Testland");
    expect(stats.dominantSeverity).toBe("critical");
  });
});
