/**
 * Geocoding service for converting user-entered addresses into coordinates.
 *
 * WHY: Centralizes API calls and error handling so UI remains clean and consistent.
 */

import { Platform } from 'react-native';
import type { DestinationPoint, LatLng } from '@/src/types/location';
import { ERROR_MESSAGES } from '@/src/constants/messages';
import { getGoogleMapsApiKey, GOOGLE_MAPS_API_KEY_WARNING } from '@/src/config/env';
import { loadGoogleMapsApi } from '@/src/services/maps/googleMapsWebLoader';

interface GeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id?: string;
  }>;
  error_message?: string;
}

const toDestinationPoint = (location: LatLng, name?: string): DestinationPoint => ({
  latitude: location.latitude,
  longitude: location.longitude,
  name,
});

const mapGeocodeStatusToError = (status: string, apiError?: string): string => {
  if (status === 'ZERO_RESULTS') {
    return ERROR_MESSAGES.GEOCODING_NO_RESULTS;
  }
  if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED') {
    return apiError || ERROR_MESSAGES.NETWORK_ERROR;
  }
  return ERROR_MESSAGES.GEOCODING_FAILED;
};

const geocodeWithFetch = async (address: string): Promise<DestinationPoint> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_MAPS_API_KEY_WARNING);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  const data = (await response.json()) as GeocodeResponse;
  if (data.status !== 'OK' || data.results.length === 0) {
    throw new Error(mapGeocodeStatusToError(data.status, data.error_message));
  }

  const result = data.results[0];
  return toDestinationPoint(
    { latitude: result.geometry.location.lat, longitude: result.geometry.location.lng },
    result.formatted_address
  );
};

const geocodeWithWebApi = async (address: string): Promise<DestinationPoint> => {
  const google = await loadGoogleMapsApi();

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status !== 'OK' || !results || results.length === 0) {
        reject(new Error(mapGeocodeStatusToError(status)));
        return;
      }

      const topResult = results[0];
      const location = topResult.geometry.location;
      resolve(
        toDestinationPoint(
          { latitude: location.lat(), longitude: location.lng() },
          topResult.formatted_address
        )
      );
    });
  });
};

export const geocodeAddress = async (address: string): Promise<DestinationPoint> => {
  if (Platform.OS === 'web') {
    try {
      return await geocodeWithWebApi(address);
    } catch (error) {
      // Fallback to REST API if JS API is unavailable
      console.warn('Web geocoding fallback to REST API:', error);
      return await geocodeWithFetch(address);
    }
  }

  return geocodeWithFetch(address);
};
