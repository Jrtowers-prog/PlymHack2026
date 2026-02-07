/**
 * Environment configuration for API keys and feature flags.
 *
 * WHY: Centralized access avoids scattering env reads and makes it easy to
 * validate required configuration across platforms.
 */

import Constants from 'expo-constants';

const readGoogleMapsApiKeyFromEnv = (): string | undefined => {
  const value = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const readGoogleMapsApiKeyFromConstants = (): string | undefined => {
  // Expo can surface extra config in different shapes depending on platform/runtime.
  const anyConstants = Constants as unknown as {
    expoConfig?: { extra?: Record<string, unknown> };
    manifest?: { extra?: Record<string, unknown> };
    manifest2?: { extra?: Record<string, unknown> };
  };

  const extra =
    anyConstants.expoConfig?.extra ??
    anyConstants.manifest?.extra ??
    anyConstants.manifest2?.extra;

  const value = extra?.googleMapsApiKey;
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const readGoogleMapsApiKey = (): string | undefined => {
  return readGoogleMapsApiKeyFromEnv() ?? readGoogleMapsApiKeyFromConstants();
};

export const getGoogleMapsApiKey = (): string => {
  return readGoogleMapsApiKey() ?? '';
};

export const hasGoogleMapsApiKey = (): boolean => {
  return Boolean(readGoogleMapsApiKey());
};

export const GOOGLE_MAPS_API_KEY_WARNING =
  'Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env or EAS env vars.';

// TODO: Ensure the Google Maps, Geocoding, and Routes/Directions APIs are enabled for this key.
