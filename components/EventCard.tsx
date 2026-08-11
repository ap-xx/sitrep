import type { ConflictEvent } from "@/lib/types";

const SEVERITY_LABEL: Record<ConflictEvent["severity"], string> = {
  low: "BAIXO",
  medium: "MÉDIO",
  high: "ALTO",
  critical: "CRÍTICO",
};

const SEVERITY_CLASS: Record<ConflictEvent["severity"], string> = {
  low: "text-severity-low border-severity-low",
  medium: "text-severity-medium border-severity-medium",
  high: "text-severity-high border-severity-high",
  critical: "text-severity-critical border-severity-critical",
};

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `há ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

export function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: ConflictEvent;
  selected: boolean;
  onSelect: (event: ConflictEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event);
        }
      }}
      className={`w-full border-l-2 px-3 py-2 text-left hover:bg-panel-border/40 ${
        SEVERITY_CLASS[event.severity]
      } ${selected ? "bg-panel-border/60" : ""}`}
    >
      <div className="flex items-center justify-between text-xs opacity-70">
        <span>{event.locationName}</span>
        <span>{SEVERITY_LABEL[event.severity]}</span>
      </div>
      <p className="text-sm">{event.headline}</p>
      <div className="mt-1 flex items-center justify-between text-xs opacity-60">
        <span>{event.country}</span>
        <span>{timeAgo(event.timestamp)}</span>
      </div>
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs underline opacity-70"
        >
          FONTE →
        </a>
      )}
    </div>
  );
}
