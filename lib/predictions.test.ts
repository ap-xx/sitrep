import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPredictionMarkets } from "./predictions";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function market(overrides: Partial<Record<string, unknown>>) {
  return {
    id: "1",
    question: "Will Russia and Ukraine agree to a ceasefire by 2027?",
    slug: "will-russia-ukraine-ceasefire",
    outcomes: JSON.stringify(["Yes", "No"]),
    outcomePrices: JSON.stringify(["0.42", "0.58"]),
    volume24hr: 100000,
    endDate: "2027-01-01T00:00:00Z",
    active: true,
    closed: false,
    ...overrides,
  };
}

function mockMarkets(markets: unknown[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => markets,
  }) as unknown as typeof fetch;
}

describe("fetchPredictionMarkets", () => {
  it("normalizes a relevant market's Yes probability as a 0-100 integer", async () => {
    mockMarkets([market({})]);

    const markets = await fetchPredictionMarkets();

    expect(markets).toHaveLength(1);
    expect(markets[0].probability).toBe(42);
    expect(markets[0].url).toBe("https://polymarket.com/event/will-russia-ukraine-ceasefire");
  });

  it("filters out markets unrelated to conflict/geopolitics", async () => {
    mockMarkets([
      market({ question: "Will the Lakers win the NBA championship?" }),
    ]);

    const markets = await fetchPredictionMarkets();

    expect(markets).toHaveLength(0);
  });

  it("filters out esports noise even when it matches a keyword like 'strike'", async () => {
    mockMarkets([
      market({ question: "Counter-Strike: Legacy vs FaZe - Map 1 Winner" }),
    ]);

    const markets = await fetchPredictionMarkets();

    expect(markets).toHaveLength(0);
  });

  it("sorts relevant markets by 24h volume, descending", async () => {
    mockMarkets([
      market({ id: "low", question: "Will there be a ceasefire in Gaza?", volume24hr: 500 }),
      market({ id: "high", question: "Will Iran and Israel go to war?", volume24hr: 5000 }),
    ]);

    const markets = await fetchPredictionMarkets();

    expect(markets.map((m) => m.id)).toEqual(["high", "low"]);
  });

  it("throws when the HTTP response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(fetchPredictionMarkets()).rejects.toThrow(/status 500/);
  });
});
