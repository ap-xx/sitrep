"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ConflictEvent } from "@/lib/types";

const SEVERITY_COLOR: Record<ConflictEvent["severity"], string> = {
  low: "#39ff88",
  medium: "#f4ff45",
  high: "#ff9f1c",
  critical: "#ff2d55",
};

export function MapView({
  events,
  selectedId,
  onSelect,
  onCountrySelect,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
  onCountrySelect: (countryName: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20, 20],
      zoom: 2,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("country-boundaries", {
        type: "vector",
        url: "mapbox://mapbox.country-boundaries-v1",
      });
      map.addLayer({
        id: "country-boundaries-fill",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: { "fill-color": "#000000", "fill-opacity": 0 },
      });

      map.on("click", "country-boundaries-fill", (e) => {
        const name = e.features?.[0]?.properties?.name_en as string | undefined;
        if (name) onCountrySelect(name);
      });
      map.on("mouseenter", "country-boundaries-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "country-boundaries-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const event of events) {
      const marker = new mapboxgl.Marker({ color: SEVERITY_COLOR[event.severity] })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => onSelect(event));
      markersRef.current.push(marker);
    }
  }, [events, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (event) {
      map.flyTo({ center: [event.lng, event.lat], zoom: 6 });
    }
  }, [selectedId, events]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-panel text-sm opacity-60">
        Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
