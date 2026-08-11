import { makeEventId } from "./ids";
import type { ConflictEvent } from "./types";

const ACLED_ENDPOINT = "https://api.acleddata.com/acled/read";

type AcledRawEvent = {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  country: string;
  location: string;
  latitude: string;
  longitude: string;
  source: string;
  notes: string;
  fatalities: string;
};

type AcledResponse = {
  success: boolean;
  data: AcledRawEvent[];
};

function severityFromFatalities(fatalities: number): ConflictEvent["severity"] {
  if (fatalities >= 20) return "critical";
  if (fatalities >= 5) return "high";
  if (fatalities >= 1) return "medium";
  return "low";
}

function last24HoursDate(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export async function fetchAcledEvents(): Promise<ConflictEvent[]> {
  const apiKey = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;

  if (!apiKey || !email) {
    throw new Error("ACLED_API_KEY and ACLED_EMAIL must be set");
  }

  const params = new URLSearchParams({
    key: apiKey,
    email,
    event_date: last24HoursDate(),
    event_date_where: ">=",
    limit: "100",
  });

  const response = await fetch(`${ACLED_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`ACLED request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AcledResponse;

  if (!payload.success) {
    throw new Error("ACLED response reported failure");
  }

  return payload.data
    .filter((raw) => raw.latitude && raw.longitude)
    .map((raw) => {
      const fatalities = Number.parseInt(raw.fatalities, 10) || 0;
      return {
        id: makeEventId("ACLED", raw.event_id_cnty),
        lat: Number.parseFloat(raw.latitude),
        lng: Number.parseFloat(raw.longitude),
        locationName: raw.location,
        country: raw.country,
        headline: `${raw.sub_event_type} — ${raw.notes}`.slice(0, 200),
        source: "ACLED",
        sourceUrl: "https://acleddata.com/data-export-tool/",
        timestamp: new Date(raw.event_date).toISOString(),
        severity: severityFromFatalities(fatalities),
        confidence: 90,
      } satisfies ConflictEvent;
    });
}
