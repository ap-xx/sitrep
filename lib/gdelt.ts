import { makeEventId } from "./ids";
import type { ConflictEvent } from "./types";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/geo/geo";

const QUERY =
  "(war OR conflict OR attack OR strike OR clash OR airstrike OR shelling OR " +
  "earthquake OR flood OR hurricane OR wildfire OR famine OR drought OR " +
  "outbreak OR epidemic OR pandemic OR evacuation OR humanitarian crisis)";

type GdeltFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name: string;
    count: number;
    html: string;
  };
};

type GdeltGeoJson = {
  type: "FeatureCollection";
  features: GdeltFeature[];
};

function extractHeadlineAndUrl(html: string): { headline: string; url: string } {
  const match = html.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (!match) {
    return { headline: "Reported activity", url: "" };
  }
  return { url: match[1], headline: match[2] };
}

export async function fetchGdeltEvents(): Promise<ConflictEvent[]> {
  const params = new URLSearchParams({
    query: QUERY,
    mode: "PointData",
    format: "GeoJSON",
    timespan: "24h",
  });

  const response = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`GDELT request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GdeltGeoJson;

  return payload.features
    .filter((f) => f.geometry?.coordinates?.length === 2)
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const { headline, url } = extractHeadlineAndUrl(feature.properties.html);
      const count = feature.properties.count ?? 1;

      return {
        id: makeEventId("GDELT", `${feature.properties.name}:${lat}:${lng}`),
        lat,
        lng,
        locationName: feature.properties.name,
        country:
          feature.properties.name.split(",").pop()?.trim() ?? feature.properties.name,
        headline,
        source: "GDELT",
        sourceUrl: url,
        timestamp: new Date().toISOString(),
        severity: "medium",
        confidence: Math.min(95, 40 + count * 5),
      } satisfies ConflictEvent;
    });
}
