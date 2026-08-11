import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { resetCacheForTests } from "./cache";

const originalFetch = global.fetch;

beforeEach(() => {
  resetCacheForTests();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.useRealTimers();
});

function chartResponse(meta: Record<string, number>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ chart: { result: [{ meta }] } }),
  };
}

describe("GET /api/commodities", () => {
  it("fetches and returns a quote per configured symbol with computed change percent", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(chartResponse({ regularMarketPrice: 110, previousClose: 100 })) as unknown as typeof fetch;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.quotes).toHaveLength(3);
    expect(body.quotes[0].price).toBe(110);
    expect(body.quotes[0].changePercent).toBeCloseTo(10);
  });

  it("falls back to chartPreviousClose when previousClose is missing", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(chartResponse({ regularMarketPrice: 50, chartPreviousClose: 40 })) as unknown as typeof fetch;

    const response = await GET();
    const body = await response.json();

    expect(body.quotes[0].changePercent).toBeCloseTo(25);
  });

  it("returns nulls for a symbol whose request fails, without failing the others", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.quotes.every((q: { price: null }) => q.price === null)).toBe(true);
  });

  it("returns nulls for a symbol whose fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.quotes.every((q: { price: null }) => q.price === null)).toBe(true);
  });

  it("serves cached quotes within the TTL instead of refetching", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(chartResponse({ regularMarketPrice: 110, previousClose: 100 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(60 * 1000);
    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
