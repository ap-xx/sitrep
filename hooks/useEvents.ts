"use client";

import { useEffect, useState } from "react";
import type { ConflictEvent } from "@/lib/types";

const POLL_INTERVAL_MS = 4 * 60 * 1000;

type EventsResponse = {
  events: ConflictEvent[];
  stale: boolean;
  updatedAt: string;
};

export function useEvents() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          } else {
            setError("Live data unavailable — retrying");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Live data unavailable — retrying");
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
  };
}
