"use client";

import { useEffect, useRef, useState } from "react";
import type { ConflictEvent } from "@/lib/types";

const POLL_INTERVAL_MS = 4 * 60 * 1000;

type EventsResponse = {
  events: ConflictEvent[];
  stale: boolean;
  updatedAt: string;
};

function mostRecentCritical(events: ConflictEvent[]): ConflictEvent {
  return events.reduce((latest, event) =>
    new Date(event.timestamp).getTime() > new Date(latest.timestamp).getTime() ? event : latest,
  );
}

export function useEvents() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<ConflictEvent | null>(null);
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/events");
        const body = (await response.json()) as EventsResponse;
        if (!cancelled) {
          if (response.ok) {
            setData(body);
            setError(null);

            const currentIds = new Set(body.events.map((event) => event.id));
            if (seenIdsRef.current) {
              const newCritical = body.events.filter(
                (event) => event.severity === "critical" && !seenIdsRef.current!.has(event.id),
              );
              if (newCritical.length > 0) {
                setAlert(mostRecentCritical(newCritical));
              }
            }
            seenIdsRef.current = currentIds;
          } else {
            setError("Dados ao vivo indisponíveis — tentando novamente");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Dados ao vivo indisponíveis — tentando novamente");
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    events: data?.events ?? [],
    stale: data?.stale ?? false,
    updatedAt: data?.updatedAt ?? null,
    error,
    alert,
  };
}
