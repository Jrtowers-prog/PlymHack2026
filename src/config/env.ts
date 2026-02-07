// src/config/env.ts
// Centralized environment config. Read EXPO_PUBLIC_* vars here.
// TODO: Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env / EAS env vars for Directions & Geocoding.
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Caller can use this to assert key presence; throws if missing.
export function requireGoogleMapsKey(): string {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Set it in your .env or EAS config.');
  }
  return GOOGLE_MAPS_API_KEY;
}

