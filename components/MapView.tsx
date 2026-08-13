"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ConflictEvent } from "@/lib/types";
import { computeCountryFillColors, DEFAULT_RISK_FILL_COLOR } from "@/lib/countryRisk";
import { countNearbyEvents, STRATEGIC_POINTS } from "@/lib/strategicPoints";

const SEVERITY_COLOR: Record<ConflictEvent["severity"], string> = {
  low: "#39ff88",
  medium: "#f4ff45",
  high: "#ff9f1c",
  critical: "#ff2d55",
};

function buildCountryFillExpression(events: ConflictEvent[]): mapboxgl.Expression {
  const colors = computeCountryFillColors(events);
  const expression: mapboxgl.Expression = ["match", ["get", "name_en"]];
  for (const [country, color] of Object.entries(colors)) {
    expression.push(country, color);
  }
  expression.push(DEFAULT_RISK_FILL_COLOR);
  return expression;
}

function createEventMarkerElement(severity: ConflictEvent["severity"]): HTMLDivElement {
  const color = SEVERITY_COLOR[severity];
  const dot = document.createElement("div");
  dot.className = "h-3 w-3 cursor-pointer rounded-full border border-black/50";
  dot.style.backgroundColor = color;
  dot.style.boxShadow = `0 0 6px 2px ${color}`;
  return dot;
}

function createStrategicPointElement(count: number): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "relative";

  const ring = document.createElement("div");
  ring.className = "h-4 w-4 rounded-full border-2 border-[#3ab7ff] bg-[#3ab7ff]/25";
  wrapper.appendChild(ring);

  if (count > 0) {
    const badge = document.createElement("div");
    badge.className =
      "absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-severity-critical text-[10px] font-bold text-white";
    badge.textContent = String(count);
    wrapper.appendChild(badge);
  }

  return wrapper;
}

export function MapView({
  events,
  selectedId,
  onSelect,
  onCountrySelect,
  focus,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
  onCountrySelect: (countryName: string) => void;
  focus: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const strategicMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const mapReadyRef = useRef(false);

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
        paint: { "fill-color": DEFAULT_RISK_FILL_COLOR, "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: "country-boundaries-outline",
        type: "line",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: { "line-color": DEFAULT_RISK_FILL_COLOR, "line-width": 1.5, "line-opacity": 0.9 },
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

      mapReadyRef.current = true;
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const event of events) {
      const marker = new mapboxgl.Marker({ element: createEventMarkerElement(event.severity) })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => onSelect(event));
      markersRef.current.push(marker);
    }
  }, [events, onSelect]);

  // Country choropleth: recolor once the style/layer is ready, and again
  // whenever the event set changes. The outline tracks the same
  // per-country severity color as the fill, just at full opacity, so
  // borders read clearly against the translucent fill.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !map.getLayer("country-boundaries-fill")) return;
    const expression = buildCountryFillExpression(events);
    map.setPaintProperty("country-boundaries-fill", "fill-color", expression);
    map.setPaintProperty("country-boundaries-outline", "line-color", expression);
  }, [events]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    strategicMarkersRef.current.forEach((marker) => marker.remove());
    strategicMarkersRef.current = [];

    for (const point of STRATEGIC_POINTS) {
      const count = countNearbyEvents(events, point);
      const marker = new mapboxgl.Marker({ element: createStrategicPointElement(count) })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new mapboxgl.Popup({ closeButton: false, offset: 12, className: "sitrep-popup" }).setText(
            point.name,
          ),
        )
        .addTo(map);
      strategicMarkersRef.current.push(marker);
    }
  }, [events]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (event) {
      map.flyTo({ center: [event.lng, event.lat], zoom: 6 });
    }
  }, [selectedId, events]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: 5 });
  }, [focus]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-panel text-sm opacity-60">
        Mapa indisponível — NEXT_PUBLIC_MAPBOX_TOKEN não está configurado.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
