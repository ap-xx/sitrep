const GAMMA_MARKETS_ENDPOINT = "https://gamma-api.polymarket.com/markets";

const RELEVANT_KEYWORDS =
  /\b(war|conflict|ceasefire|invasion|invade|strike|missile|troops|military|nuclear|sanctions?|ukraine|russia|israel|iran|gaza|hamas|hezbollah|taiwan|nato|coup|border|blockade|airstrike|occupation)\b/i;

const NOISE_KEYWORDS =
  /counter-strike|esports|dota|league of legends|\blol\b|valorant|\bcs2\b|csgo|\bbo[135]\b|game winner|map winner/i;

export type PredictionMarket = {
  id: string;
  question: string;
  probability: number;
  volume24hr: number;
  endDate: string | null;
  url: string;
};

type GammaMarket = {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume24hr?: number;
  endDate?: string;
  active: boolean;
  closed: boolean;
};

function parseProbability(market: GammaMarket): number | null {
  try {
    const outcomes = JSON.parse(market.outcomes) as string[];
    const prices = JSON.parse(market.outcomePrices) as string[];
    const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    const index = yesIndex >= 0 ? yesIndex : 0;
    const price = Number.parseFloat(prices[index]);
    if (!Number.isFinite(price)) return null;
    return Math.round(price * 100);
  } catch {
    return null;
  }
}

export async function fetchPredictionMarkets(): Promise<PredictionMarket[]> {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: "200",
    order: "volume24hr",
    ascending: "false",
  });

  const response = await fetch(`${GAMMA_MARKETS_ENDPOINT}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Polymarket request failed with status ${response.status}`);
  }

  const markets = (await response.json()) as GammaMarket[];

  return markets
    .filter(
      (m) => RELEVANT_KEYWORDS.test(m.question) && !NOISE_KEYWORDS.test(m.question),
    )
    .map((m) => {
      const probability = parseProbability(m);
      if (probability === null) return null;

      return {
        id: m.id,
        question: m.question,
        probability,
        volume24hr: m.volume24hr ?? 0,
        endDate: m.endDate ?? null,
        url: `https://polymarket.com/event/${m.slug}`,
      } satisfies PredictionMarket;
    })
    .filter((m): m is PredictionMarket => m !== null)
    .sort((a, b) => b.volume24hr - a.volume24hr)
    .slice(0, 10);
}
