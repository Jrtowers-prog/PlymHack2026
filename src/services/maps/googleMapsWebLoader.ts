/**
 * Google Maps JavaScript API loader for web-only usage.
 *
 * WHY: Shared loader for map view, geocoding, and directions on web to avoid
 * duplicate script injection and ensure consistent API key usage.
 */

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { getGoogleMapsApiKey, GOOGLE_MAPS_API_KEY_WARNING } from '@/src/config/env';

type GoogleMapsLoaderCache = {
  __saferouteGoogleMapsLoadPromise?: Promise<typeof google>;
  __saferouteGoogleMapsOptionsSet?: boolean;
  __saferouteGoogleMapsApiKey?: string;
};

const getWindowCache = (): GoogleMapsLoaderCache => {
  return window as unknown as GoogleMapsLoaderCache;
};

export const loadGoogleMapsApi = async (): Promise<typeof google> => {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps JS API can only be loaded in a browser environment.');
  }

  if (window.google?.maps) {
    return window.google;
  }

  const cache = getWindowCache();

  if (!cache.__saferouteGoogleMapsLoadPromise) {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error(GOOGLE_MAPS_API_KEY_WARNING);
    }

    // In dev, Fast Refresh can cause this module to be re-evaluated.
    // Cache on window so we don't call setOptions multiple times.
    if (!cache.__saferouteGoogleMapsOptionsSet) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      cache.__saferouteGoogleMapsOptionsSet = true;
      cache.__saferouteGoogleMapsApiKey = apiKey;
    } else if (cache.__saferouteGoogleMapsApiKey && cache.__saferouteGoogleMapsApiKey !== apiKey) {
      // eslint-disable-next-line no-console
      console.warn(
        'Google Maps API key changed during runtime. Restart the dev server to ensure the new key is applied.'
      );
    }

    cache.__saferouteGoogleMapsLoadPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('routes'),
      importLibrary('geocoding'),
    ]).then(() => window.google);
  }

  return cache.__saferouteGoogleMapsLoadPromise;
};
