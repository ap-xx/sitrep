"use client";

import { useState, useCallback } from "react";
import { MapView } from "@/components/MapView";
import { NewsFeed } from "@/components/NewsFeed";
import { CountryPanel } from "@/components/CountryPanel";
import { useEvents } from "@/hooks/useEvents";
import type { ConflictEvent } from "@/lib/types";

export default function Home() {
  const { events, stale, error } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleSelect = useCallback((event: ConflictEvent) => {
    setSelectedId(event.id);
  }, []);

  const handleCountrySelect = useCallback((countryName: string) => {
    setSelectedCountry(countryName);
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-panel-border bg-panel px-4 py-2">
        <span className="text-lg font-bold tracking-widest text-glow">SITREP</span>
        <span className="flex items-center gap-2 text-xs text-glow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-phosphor" />
          LIVE
        </span>
      </header>
      {(error || stale) && (
        <div className="bg-severity-high/20 px-4 py-1 text-center text-xs text-severity-high">
          {error ?? "Showing cached data — live sources are temporarily unavailable."}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <MapView
            events={events}
            selectedId={selectedId}
            onSelect={handleSelect}
            onCountrySelect={handleCountrySelect}
          />
          {selectedCountry && (
            <CountryPanel
              countryName={selectedCountry}
              events={events}
              onClose={() => setSelectedCountry(null)}
            />
          )}
        </div>
        <NewsFeed events={events} selectedId={selectedId} onSelect={handleSelect} />
      </div>
    </main>
  );
}
