import { describe, expect, it } from "vitest";
import { isPlottable, isSafeUrl, sanitizeEvents } from "./sanitizeEvents";
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

describe("isPlottable", () => {
  it("returns false for NaN lat", () => {
    expect(isPlottable(makeEvent({ lat: Number.NaN }))).toBe(false);
  });

  it("returns false for out-of-range lat", () => {
    expect(isPlottable(makeEvent({ lat: 91 }))).toBe(false);
    expect(isPlottable(makeEvent({ lat: -91 }))).toBe(false);
  });

  it("returns false for out-of-range lng", () => {
    expect(isPlottable(makeEvent({ lng: 181 }))).toBe(false);
    expect(isPlottable(makeEvent({ lng: -181 }))).toBe(false);
  });

  it("returns true for valid lat/lng", () => {
    expect(isPlottable(makeEvent({ lat: 13.05, lng: 43.25 }))).toBe(true);
  });
});

describe("isSafeUrl", () => {
  it("rejects a javascript: URL", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("allows an empty sourceUrl", () => {
    expect(isSafeUrl("")).toBe(true);
  });

  it("allows a valid https:// URL", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
  });
});

describe("sanitizeEvents", () => {
  it("filters out events with NaN or out-of-range lat/lng", () => {
    const events = [
      makeEvent({ id: "1", lat: Number.NaN }),
      makeEvent({ id: "2", lat: 200 }),
      makeEvent({ id: "3", lng: 200 }),
      makeEvent({ id: "4" }),
    ];
    const result = sanitizeEvents(events);
    expect(result.map((e) => e.id)).toEqual(["4"]);
  });

  it("filters out an event with a javascript: URL", () => {
    const events = [
      makeEvent({ id: "1", sourceUrl: "javascript:alert(1)" }),
      makeEvent({ id: "2", sourceUrl: "https://example.com" }),
    ];
    const result = sanitizeEvents(events);
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });

  it("allows an empty sourceUrl through", () => {
    const events = [makeEvent({ id: "1", sourceUrl: "" })];
    expect(sanitizeEvents(events)).toHaveLength(1);
  });

  it("drops a second event with a duplicate id, keeping the first", () => {
    const events = [
      makeEvent({ id: "dup", headline: "first" }),
      makeEvent({ id: "dup", headline: "second" }),
    ];
    const result = sanitizeEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe("first");
  });
});
