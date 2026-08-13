import type { ConflictEvent } from "./types";

export function countRecentEvents(events: ConflictEvent[], hours = 48): number {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return events.filter((event) => new Date(event.timestamp).getTime() >= cutoff).length;
}
