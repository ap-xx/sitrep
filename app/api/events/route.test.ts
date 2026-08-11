import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConflictEvent } from "@/lib/types";

vi.mock("@/lib/acled");
vi.mock("@/lib/gdelt");
vi.mock("@/lib/refineWithClaude");

import { GET } from "./route";
import { CACHE_TTL_MS, resetCacheForTests } from "./cache";
import * as acledModule from "@/lib/acled";
import * as gdeltModule from "@/lib/gdelt";
import * as refineModule from "@/lib/refineWithClaude";

const fetchAcledEventsMock = vi.mocked(acledModule.fetchAcledEvents);
const fetchGdeltEventsMock = vi.mocked(gdeltModule.fetchGdeltEvents);
const refineWithClaudeMock = vi.mocked(refineModule.refineWithClaude);

const sampleEvent: ConflictEvent = {
  id: "abc123",
  lat: 1,
  lng: 2,
  locationName: "Somewhere",
  country: "Testland",
  headline: "Something happened",
  source: "ACLED",
  sourceUrl: "https://example.com",
  timestamp: "2026-08-10T00:00:00.000Z",
  severity: "medium",
  confidence: 80,
};

beforeEach(() => {
  resetCacheForTests();
  fetchAcledEventsMock.mockReset();
  fetchGdeltEventsMock.mockReset();
  refineWithClaudeMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/events", () => {
  it("returns refined events combining both sources", async () => {
    fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
    fetchGdeltEventsMock.mockResolvedValue([]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(body.events).toHaveLength(1);
    expect(body.stale).toBe(false);
    expect(refineWithClaudeMock).toHaveBeenCalledWith([sampleEvent]);
  });

  it("serves cached results without re-fetching on the second call", async () => {
    fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
    fetchGdeltEventsMock.mockResolvedValue([]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    await GET();
    await GET();

    expect(fetchAcledEventsMock).toHaveBeenCalledTimes(1);
    expect(fetchGdeltEventsMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to GDELT data when ACLED fails", async () => {
    fetchAcledEventsMock.mockRejectedValue(new Error("ACLED down"));
    fetchGdeltEventsMock.mockResolvedValue([sampleEvent]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(body.events).toHaveLength(1);
    expect(body.stale).toBe(false);
  });

  it("returns a 503 with no events when both sources fail and there is no cache", async () => {
    fetchAcledEventsMock.mockRejectedValue(new Error("ACLED down"));
    fetchGdeltEventsMock.mockRejectedValue(new Error("GDELT down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.events).toEqual([]);
    expect(body.stale).toBe(true);
  });

  it("returns 200 with empty array when both sources resolve to empty arrays", async () => {
    fetchAcledEventsMock.mockResolvedValue([]);
    fetchGdeltEventsMock.mockResolvedValue([]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toEqual([]);
    expect(body.stale).toBe(false);
    expect(refineWithClaudeMock).toHaveBeenCalledWith([]);
  });

  it("dedupes events sharing the same id across sources", async () => {
    const duplicate: ConflictEvent = { ...sampleEvent, headline: "Duplicate from GDELT" };
    fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
    fetchGdeltEventsMock.mockResolvedValue([duplicate]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(body.events).toHaveLength(1);
  });

  it("returns the stale cache instead of overwriting it when one source rejects and the other resolves empty", async () => {
    vi.useFakeTimers();
    try {
      fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
      fetchGdeltEventsMock.mockResolvedValue([]);
      refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

      // Prime the cache with a successful call.
      await GET();

      // Advance past the cache TTL so the second call actually re-fetches.
      vi.advanceTimersByTime(CACHE_TTL_MS + 1);

      fetchAcledEventsMock.mockRejectedValue(new Error("ACLED down"));
      fetchGdeltEventsMock.mockResolvedValue([]);

      const response = await GET();
      const body = await response.json();

      expect(body.events).toEqual([sampleEvent]);
      expect(body.stale).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
