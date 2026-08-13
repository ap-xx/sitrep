import { describe, expect, it, vi } from "vitest";
import { countRecentEvents } from "./recentEvents";
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

describe("countRecentEvents", () => {
  it("counts events within the window and excludes older ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T00:00:00.000Z"));

    const events = [
      makeEvent({ id: "recent", timestamp: "2026-08-12T12:00:00.000Z" }), // 12h ago
      makeEvent({ id: "old", timestamp: "2026-08-01T00:00:00.000Z" }), // way past 48h
    ];

    expect(countRecentEvents(events, 48)).toBe(1);

    vi.useRealTimers();
  });

  it("returns 0 for an empty event list", () => {
    expect(countRecentEvents([], 48)).toBe(0);
  });
});
