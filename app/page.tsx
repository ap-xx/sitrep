"use client";

import { useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/MapView";
import { NewsFeed } from "@/components/NewsFeed";
import { CountryPanel } from "@/components/CountryPanel";
import { TrendsPanel } from "@/components/TrendsPanel";
import { CommoditiesTicker } from "@/components/CommoditiesTicker";
import { useEvents } from "@/hooks/useEvents";
import { playAlertBeep } from "@/lib/alertSound";
import type { ConflictEvent } from "@/lib/types";
import type { CountryTrend } from "@/lib/trends";

const ALERT_DISPLAY_MS = 6000;

export default function Home() {
  const { events, stale, error, alert } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [activeAlert, setActiveAlert] = useState<ConflictEvent | null>(null);

  const handleSelect = useCallback((event: ConflictEvent) => {
    setSelectedId(event.id);
  }, []);

  const handleCountrySelect = useCallback((countryName: string) => {
    setSelectedCountry(countryName);
  }, []);

  const handleTrendSelect = useCallback((trend: CountryTrend) => {
    setSelectedCountry(trend.country);
    setMapFocus({ lat: trend.lat, lng: trend.lng });
  }, []);

  useEffect(() => {
    if (!alert) return;
    setActiveAlert(alert);
    playAlertBeep();
    const timer = setTimeout(() => setActiveAlert(null), ALERT_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [alert]);

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-panel-border bg-panel px-4 py-2">
        <span className="text-lg font-bold tracking-widest text-glow">SITREP</span>
        <span className="flex items-center gap-2 text-xs text-glow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-phosphor" />
          AO VIVO
        </span>
      </header>
      <CommoditiesTicker />
      {activeAlert && (
        <div className="animate-pulse border-b border-severity-critical bg-severity-critical/20 px-4 py-1 text-center text-xs font-bold text-severity-critical text-glow">
          ⚠ NOVO EVENTO CRÍTICO — {activeAlert.country}: {activeAlert.headline}
        </div>
      )}
      {(error || stale) && (
        <div className="bg-severity-high/20 px-4 py-1 text-center text-xs text-severity-high">
          {error ?? "Mostrando dados em cache — fontes ao vivo temporariamente indisponíveis."}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <MapView
            events={events}
            selectedId={selectedId}
            onSelect={handleSelect}
            onCountrySelect={handleCountrySelect}
            focus={mapFocus}
          />
          <TrendsPanel events={events} onSelect={handleTrendSelect} />
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
