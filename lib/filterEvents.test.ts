import { describe, expect, it } from "vitest";
import { filterBySeverity } from "./filterEvents";
import type { ConflictEvent } from "./types";

function makeEvent(overrides: Partial<ConflictEvent>): ConflictEvent {
  return {
    id: "id",
    lat: 0,
    lng: 0,
    locationName: "loc",
    country: "country",
    headline: "headline",
    source: "ACLED",
    sourceUrl: "https://example.com",
    timestamp: "2026-08-10T00:00:00.000Z",
    severity: "low",
    confidence: 50,
    ...overrides,
  };
}

const events: ConflictEvent[] = [
  makeEvent({ id: "1", severity: "low" }),
  makeEvent({ id: "2", severity: "critical" }),
  makeEvent({ id: "3", severity: "critical" }),
];

describe("filterBySeverity", () => {
  it("returns all events when filter is 'all'", () => {
    expect(filterBySeverity(events, "all")).toHaveLength(3);
  });

  it("returns only events matching the given severity", () => {
    const result = filterBySeverity(events, "critical");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.severity === "critical")).toBe(true);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterBySeverity(events, "high")).toEqual([]);
  });
});
