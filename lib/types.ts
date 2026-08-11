export type Severity = "low" | "medium" | "high" | "critical";

export type ConflictEvent = {
  id: string;
  lat: number;
  lng: number;
  locationName: string;
  country: string;
  headline: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  severity: Severity;
  confidence: number;
};
