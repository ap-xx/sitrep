import { describe, expect, it } from "vitest";
import { computeCountryTrends } from "./trends";
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

describe("computeCountryTrends", () => {
  it("ranks countries by event count, descending", () => {
    const events = [
      makeEvent({ country: "A" }),
      makeEvent({ country: "B" }),
      makeEvent({ country: "B" }),
      makeEvent({ country: "B" }),
      makeEvent({ country: "C" }),
      makeEvent({ country: "C" }),
    ];

    const trends = computeCountryTrends(events);

    expect(trends.map((t) => t.country)).toEqual(["B", "C", "A"]);
    expect(trends[0].eventCount).toBe(3);
  });

  it("breaks ties in event count by dominant severity", () => {
    const events = [
      makeEvent({ country: "Low", severity: "low" }),
      makeEvent({ country: "Critical", severity: "critical" }),
    ];

    const trends = computeCountryTrends(events);

    expect(trends.map((t) => t.country)).toEqual(["Critical", "Low"]);
  });

  it("computes the average lat/lng of a country's events", () => {
    const events = [
      makeEvent({ country: "Testland", lat: 10, lng: 20 }),
      makeEvent({ country: "Testland", lat: 20, lng: 40 }),
    ];

    const [trend] = computeCountryTrends(events);

    expect(trend.lat).toBe(15);
    expect(trend.lng).toBe(30);
  });

  it("limits results to the given limit", () => {
    const events = Array.from({ length: 15 }, (_, i) =>
      makeEvent({ country: `Country${i}` }),
    );

    const trends = computeCountryTrends(events, 10);

    expect(trends).toHaveLength(10);
  });
});
