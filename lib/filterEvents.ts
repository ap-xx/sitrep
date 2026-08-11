import type { ConflictEvent, Severity } from "./types";

export type SeverityFilterValue = "all" | Severity;

export function filterBySeverity(
  events: ConflictEvent[],
  filter: SeverityFilterValue,
): ConflictEvent[] {
  if (filter === "all") return events;
  return events.filter((event) => event.severity === filter);
}
