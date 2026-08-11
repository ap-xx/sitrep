"use client";

import { useState, useCallback } from "react";
import { MapView } from "@/components/MapView";
import { NewsFeed } from "@/components/NewsFeed";
import { useEvents } from "@/hooks/useEvents";
import type { ConflictEvent } from "@/lib/types";

export default function Home() {
  const { events, stale, error } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((event: ConflictEvent) => {
    setSelectedId(event.id);
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-panel-border bg-panel px-4 py-2">
        <span className="text-lg font-bold tracking-wide">SITREP</span>
        <span className="flex items-center gap-2 text-xs text-severity-critical">
          <span className="h-2 w-2 rounded-full bg-severity-critical" />
          LIVE
        </span>
      </header>
      {(error || stale) && (
        <div className="bg-severity-high/20 px-4 py-1 text-center text-xs text-severity-high">
          {error ?? "Showing cached data — live sources are temporarily unavailable."}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <MapView events={events} selectedId={selectedId} onSelect={handleSelect} />
        <NewsFeed events={events} selectedId={selectedId} onSelect={handleSelect} />
      </div>
    </main>
  );
}
