import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/predictions");

import { GET } from "./route";
import { resetCacheForTests } from "./cache";
import * as predictionsModule from "@/lib/predictions";

const fetchPredictionMarketsMock = vi.mocked(predictionsModule.fetchPredictionMarkets);

const sampleMarket = {
  id: "1",
  question: "Will Russia and Ukraine agree to a ceasefire by 2027?",
  probability: 42,
  volume24hr: 100000,
  endDate: "2027-01-01T00:00:00Z",
  url: "https://polymarket.com/event/x",
};

beforeEach(() => {
  resetCacheForTests();
  fetchPredictionMarketsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/predictions", () => {
  it("returns freshly fetched markets", async () => {
    fetchPredictionMarketsMock.mockResolvedValue([sampleMarket]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.markets).toEqual([sampleMarket]);
  });

  it("falls back to the stale cache when the fetch fails and a cache exists", async () => {
    fetchPredictionMarketsMock.mockResolvedValueOnce([sampleMarket]);
    await GET();

    fetchPredictionMarketsMock.mockRejectedValueOnce(new Error("Polymarket down"));
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60 * 1000);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.markets).toEqual([sampleMarket]);
  });

  it("returns a 503 with no markets when the fetch fails and there is no cache", async () => {
    fetchPredictionMarketsMock.mockRejectedValue(new Error("Polymarket down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.markets).toEqual([]);
  });
});
