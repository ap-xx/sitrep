import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConflictEvent } from "./types";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

import { refineWithClaude } from "./refineWithClaude";

const sampleEvents: ConflictEvent[] = [
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
    severity: "medium",
    confidence: 90,
  },
];

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
});
