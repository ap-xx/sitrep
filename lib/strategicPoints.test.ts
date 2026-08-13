import { describe, expect, it } from "vitest";
import { countNearbyEvents, STRATEGIC_POINTS } from "./strategicPoints";
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

describe("countNearbyEvents", () => {
  const hormuz = STRATEGIC_POINTS.find((p) => p.name === "Estreito de Ormuz")!;

  it("counts an event very close to the point", () => {
    const events = [makeEvent({ lat: hormuz.lat + 0.1, lng: hormuz.lng + 0.1 })];
    expect(countNearbyEvents(events, hormuz)).toBe(1);
  });

  it("does not count an event far from the point", () => {
    const events = [makeEvent({ lat: 0, lng: 0 })];
    expect(countNearbyEvents(events, hormuz)).toBe(0);
  });

  it("respects a custom radius", () => {
    const events = [makeEvent({ lat: hormuz.lat + 2, lng: hormuz.lng + 2 })];
    expect(countNearbyEvents(events, hormuz, 50)).toBe(0);
    expect(countNearbyEvents(events, hormuz, 1000)).toBe(1);
  });
});
