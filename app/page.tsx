"use client";

import { useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/MapView";
import { NewsFeed } from "@/components/NewsFeed";
import { CountryPanel } from "@/components/CountryPanel";
import { TrendsPanel } from "@/components/TrendsPanel";
import { TrendsFullView } from "@/components/TrendsFullView";
import { CommoditiesTicker } from "@/components/CommoditiesTicker";
import { CommoditiesFullView } from "@/components/CommoditiesFullView";
import { PredictionsPanel } from "@/components/PredictionsPanel";
import { ConflictAlertPopup } from "@/components/ConflictAlertPopup";
import { useEvents } from "@/hooks/useEvents";
import { playAlertBeep, primeAlertAudio } from "@/lib/alertSound";
import type { ConflictEvent } from "@/lib/types";
import type { CountryTrend } from "@/lib/trends";

const ALERT_DISPLAY_MS = 6000;

type Tab = "mapa" | "tendencias" | "commodities" | "previsoes";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "mapa", label: "MAPA" },
  { value: "tendencias", label: "TENDÊNCIAS" },
  { value: "commodities", label: "COMMODITIES" },
  { value: "previsoes", label: "PREVISÕES" },
];

export default function Home() {
  const { events, stale, error, alert } = useEvents();
  const [activeTab, setActiveTab] = useState<Tab>("mapa");
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

  const handleViewOnMap = useCallback((country: string, lat: number, lng: number) => {
    setSelectedCountry(country);
    setMapFocus({ lat, lng });
    setActiveTab("mapa");
  }, []);

  useEffect(() => {
    primeAlertAudio();
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
      <nav className="flex gap-1 border-b border-panel-border bg-panel px-2 py-1 text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded px-3 py-1 uppercase tracking-wide ${
              activeTab === tab.value ? "bg-panel-border text-glow" : "opacity-60 hover:opacity-90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {(error || stale) && (
        <div className="bg-severity-high/20 px-4 py-1 text-center text-xs text-severity-high">
          {error ?? "Mostrando dados em cache — fontes ao vivo temporariamente indisponíveis."}
        </div>
      )}

      {activeTab === "mapa" && (
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
            {activeAlert && (
              <ConflictAlertPopup event={activeAlert} onClose={() => setActiveAlert(null)} />
            )}
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
      )}

      {activeTab === "tendencias" && (
        <TrendsFullView events={events} onViewOnMap={handleViewOnMap} />
      )}

      {activeTab === "commodities" && <CommoditiesFullView />}

      {activeTab === "previsoes" && <PredictionsPanel />}
    </main>
  );
}
