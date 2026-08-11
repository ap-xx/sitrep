import type { ConflictEvent } from "./types";

export function isPlottable(event: ConflictEvent): boolean {
  return (
    Number.isFinite(event.lat) &&
    event.lat >= -90 &&
    event.lat <= 90 &&
    Number.isFinite(event.lng) &&
    event.lng >= -180 &&
    event.lng <= 180
  );
}

export function isSafeUrl(url: string): boolean {
  if (url === "") return true;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function sanitizeEvents(events: ConflictEvent[]): ConflictEvent[] {
  const seenIds = new Set<string>();
  const result: ConflictEvent[] = [];

  for (const event of events) {
    if (!isPlottable(event)) continue;
    if (!isSafeUrl(event.sourceUrl)) continue;
    if (seenIds.has(event.id)) continue;
    seenIds.add(event.id);
    result.push(event);
  }

  return result;
}
