import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConflictEvent } from "./types";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

import { refineWithClaude } from "./refineWithClaude";

function makeEvent(overrides: Partial<ConflictEvent>): ConflictEvent {
  return {
    id: "id",
    lat: 13.05,
    lng: 43.25,
    locationName: "Al Mokha",
    country: "Yemen",
    headline: "Cargo vessel struck",
    source: "ACLED",
    sourceUrl: "https://example.com",
    timestamp: "2026-08-10T00:00:00.000Z",
    severity: "medium",
    confidence: 90,
    ...overrides,
  };
}

const sampleEvents: ConflictEvent[] = [makeEvent({ id: "abc123" })];

afterEach(() => {
  createMock.mockReset();
  vi.unstubAllEnvs();
});

describe("refineWithClaude", () => {
  it("returns refined events when Claude responds with valid JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const refined: ConflictEvent[] = [
      { ...sampleEvents[0], headline: "Refined headline", severity: "high", confidence: 95 },
    ];

    createMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(refined) }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result[0].headline).toBe("Refined headline");
    expect(result[0].severity).toBe("high");
  });

  it("falls back to the original events when the API call fails", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    createMock.mockRejectedValue(new Error("network error"));

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("falls back to the original events when the response isn't valid JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("returns events unchanged when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("falls back to original events when Claude returns valid JSON with a missing required field", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    // Valid JSON but missing sourceUrl field
    const invalidResponse = [
      {
        id: "abc123",
        lat: 13.05,
        lng: 43.25,
        locationName: "Al Mokha",
        country: "Yemen",
        headline: "Cargo vessel struck",
        source: "ACLED",
        // sourceUrl is missing
        timestamp: "2026-08-10T00:00:00.000Z",
        severity: "medium",
        confidence: 90,
      },
    ];

    createMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(invalidResponse) }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("falls back to original events when Claude returns valid JSON with invalid severity value", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    // Valid JSON but severity is invalid
    const invalidResponse = [
      {
        id: "abc123",
        lat: 13.05,
        lng: 43.25,
        locationName: "Al Mokha",
        country: "Yemen",
        headline: "Cargo vessel struck",
        source: "ACLED",
        sourceUrl: "https://example.com",
        timestamp: "2026-08-10T00:00:00.000Z",
        severity: "extreme", // Invalid severity value
        confidence: 90,
      },
    ];

    createMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(invalidResponse) }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("caps the number of events sent to Claude at 60, passing the rest through untouched", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const manyEvents: ConflictEvent[] = Array.from({ length: 65 }, (_, i) =>
      makeEvent({ id: `event-${i}` }),
    );

    createMock.mockImplementation(async ({ messages }) => {
      const prompt = messages[0].content as string;
      const jsonStart = prompt.indexOf("[");
      const sentEvents = JSON.parse(prompt.slice(jsonStart)) as ConflictEvent[];
      const refined = sentEvents.map((e) => ({ ...e, headline: "Refined" }));
      return { content: [{ type: "text", text: JSON.stringify(refined) }] };
    });

    const result = await refineWithClaude(manyEvents);

    expect(createMock).toHaveBeenCalledTimes(1);
    const callArgs = createMock.mock.calls[0][0];
    const prompt = callArgs.messages[0].content as string;
    const jsonStart = prompt.indexOf("[");
    const sentEvents = JSON.parse(prompt.slice(jsonStart)) as ConflictEvent[];
    expect(sentEvents).toHaveLength(60);

    expect(result).toHaveLength(65);
    expect(result.slice(0, 60).every((e) => e.headline === "Refined")).toBe(true);
    expect(result.slice(60)).toEqual(manyEvents.slice(60));
  });

  it("recovers events from a response truncated mid-array, keeping the unfinished event raw", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const threeEvents: ConflictEvent[] = [
      makeEvent({ id: "e1", headline: "Original 1" }),
      makeEvent({ id: "e2", headline: "Original 2" }),
      makeEvent({ id: "e3", headline: "Original 3" }),
    ];

    const refinedFirstTwo = [
      { ...threeEvents[0], headline: "Refined 1" },
      { ...threeEvents[1], headline: "Refined 2" },
    ];

    // Simulate a response truncated mid-object, wrapped in an opening
    // markdown fence with no closing fence — matches what Claude produces
    // when it hits max_tokens partway through the array.
    const truncatedText =
      "```json\n" +
      JSON.stringify(refinedFirstTwo).slice(0, -1) +
      ',{"id":"e3","lat":13.05,"lng":43.25,"headline":"Refined 3 but cut off';

    createMock.mockResolvedValue({
      content: [{ type: "text", text: truncatedText }],
    });

    const result = await refineWithClaude(threeEvents);

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.id === "e1")?.headline).toBe("Refined 1");
    expect(result.find((e) => e.id === "e2")?.headline).toBe("Refined 2");
    expect(result.find((e) => e.id === "e3")?.headline).toBe("Original 3");
  });

  it("falls back to raw events when the truncated response has no complete elements to recover", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    createMock.mockResolvedValue({
      content: [
        { type: "text", text: '```json\n[{"id":"abc123","lat":13.05,"headline":"cut off mid' },
      ],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("logs a warning via console.warn when a failure path falls back to raw events", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    createMock.mockRejectedValue(new Error("network error"));

    await refineWithClaude(sampleEvents);

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
