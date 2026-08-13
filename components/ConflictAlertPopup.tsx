"use client";

import type { ConflictEvent } from "@/lib/types";

const TYPE_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /missile|míssil/i, label: "ATAQUE COM MÍSSEL" },
  { regex: /air ?strike|ataque aéreo/i, label: "ATAQUE AÉREO" },
  { regex: /shelling|bombardeio|artilharia/i, label: "BOMBARDEIO" },
  { regex: /drone/i, label: "ATAQUE COM DRONE" },
  { regex: /aircraft.*(down|shot)|avião.*abatid/i, label: "AERONAVE ABATIDA" },
];

function classifyAlertType(headline: string): string {
  return TYPE_PATTERNS.find((p) => p.regex.test(headline))?.label ?? "EVENTO CRÍTICO";
}

function minutesAgo(timestamp: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
}

export function ConflictAlertPopup({
  event,
  onClose,
}: {
  event: ConflictEvent;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-1/2 top-4 z-50 w-80 -translate-x-1/2 border border-severity-critical bg-panel/95 p-3 text-sm shadow-[0_0_20px_rgba(255,45,85,0.35)]">
      <span className="pointer-events-none absolute -left-px -top-px h-3 w-3 border-l border-t border-severity-critical" />
      <span className="pointer-events-none absolute -right-px -top-px h-3 w-3 border-r border-t border-severity-critical" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b border-l border-severity-critical" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-b border-r border-severity-critical" />

      <div className="flex items-start justify-between gap-2">
        <span className="text-glow flex items-center gap-2 font-bold text-severity-critical">
          <span className="h-2 w-2 animate-pulse rounded-full bg-severity-critical" />
          {classifyAlertType(event.headline)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar alerta"
          className="opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 opacity-90">{event.headline}</p>
      <p className="mt-2 text-xs opacity-60">
        Fonte verificada há {minutesAgo(event.timestamp)} min — {event.country}
      </p>
    </div>
  );
}
