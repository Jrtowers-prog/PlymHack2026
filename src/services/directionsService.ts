// src/services/directionsService.ts
import { LatLng, RouteShape, DirectionsResult } from '../types/navigation';
import { GOOGLE_MAPS_API_KEY, requireGoogleMapsKey } from '../config/env';
import { ServiceError } from './errors';

// Minimal polyline decoder (Google Encoded Polyline Algorithm Format)
// Source: common implementations (kept small for the repo).
function decodePolyline(encoded: string): LatLng[] {
  const coords: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    result = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    coords.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
  }
  return coords;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new ServiceError('network', `Network error ${res.status}`, { url, status: res.status });
  return res.json();
}

export async function fetchDirectionsByAddress(
  origin: LatLng,
  destinationAddress: string
): Promise<DirectionsResult> {
  // Require API key to be present. Caller should set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
  try {
    requireGoogleMapsKey();
  } catch (err) {
    throw new ServiceError('config.missing', 'Missing Google Maps API key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY).');
  }

  // 1) Geocode destination address
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    destinationAddress
  )}&key=${GOOGLE_MAPS_API_KEY}`;
  const geocode = await fetchJson(geocodeUrl);
  if (!geocode.results || geocode.results.length === 0) {
    throw new ServiceError('geocode.not_found', 'Destination address not found', { address: destinationAddress });
  }
  const destLoc = geocode.results[0].geometry.location as { lat: number; lng: number };
  const dest: LatLng = { latitude: destLoc.lat, longitude: destLoc.lng };

  // 2) Directions request (walking, alternatives)
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${dest.latitude},${dest.longitude}`;
  const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=walking&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;

  const directions = await fetchJson(directionsUrl);
  if (directions.status !== 'OK') {
    throw new ServiceError('directions.error', 'Directions API error', { status: directions.status, error: directions.error_message });
  }

  const routes: RouteShape[] = (directions.routes as any[]).map((r: any, idx: number) => {
    const overviewPolyline = r.overview_polyline?.points ?? '';
    const coords = overviewPolyline ? decodePolyline(overviewPolyline) : [origin, dest];
    const distanceMeters = r.legs?.reduce((s: number, leg: any) => s + (leg.distance?.value ?? 0), 0) ?? 0;
    const durationSeconds = r.legs?.reduce((s: number, leg: any) => s + (leg.duration?.value ?? 0), 0) ?? 0;
    return {
      id: r.summary ? `${idx}-${r.summary}` : `route-${idx}`,
      distanceMeters,
      durationSeconds,
      coordinates: coords,
    } as RouteShape;
  });

  return { routes };
}

// TODO: add fetchDirectionsByCoords if needed
