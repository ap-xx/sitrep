import type { ConflictEvent } from "./types";

export type StrategicPoint = {
  name: string;
  lat: number;
  lng: number;
};

export const STRATEGIC_POINTS: StrategicPoint[] = [
  { name: "Estreito de Ormuz", lat: 26.6, lng: 56.25 },
  { name: "Canal de Suez", lat: 30.5, lng: 32.35 },
  { name: "Bab-el-Mandeb", lat: 12.6, lng: 43.4 },
  { name: "Bósforo", lat: 41.1, lng: 29.05 },
  { name: "Gibraltar", lat: 36.14, lng: -5.35 },
  { name: "Canal do Panamá", lat: 9.08, lng: -79.68 },
  { name: "Estreito de Kerch", lat: 45.3, lng: 36.6 },
  { name: "Estreito de Malaca", lat: 2.5, lng: 101.4 },
];

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function countNearbyEvents(
  events: ConflictEvent[],
  point: StrategicPoint,
  radiusKm = 400,
): number {
  return events.filter((event) => haversineKm(event.lat, event.lng, point.lat, point.lng) <= radiusKm)
    .length;
}
