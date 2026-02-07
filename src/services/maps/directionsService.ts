/**
 * Directions service for walking routes with alternatives.
 *
 * WHY: Encapsulates API calls and response parsing to keep UI code simple.
 */

import { Platform } from 'react-native';
import type { LatLng } from '@/src/types/location';
import type { RouteOption } from '@/src/types/routes';
import { ERROR_MESSAGES } from '@/src/constants/messages';
import { decodePolyline } from '@/src/utils/polyline';
import { getGoogleMapsApiKey, GOOGLE_MAPS_API_KEY_WARNING } from '@/src/config/env';
import { loadGoogleMapsApi } from '@/src/services/maps/googleMapsWebLoader';

interface ComputeRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface LegacyDirectionsResponse {
  status: string;
  routes: Array<{
    overview_polyline?: {
      points?: string;
    };
    legs?: Array<{
      distance?: {
        value?: number;
      };
      duration?: {
        value?: number;
      };
    }>;
  }>;
  error_message?: string;
}

const parseDurationSeconds = (duration: string | undefined): number => {
  if (!duration) {
    return 0;
  }

  const match = duration.match(/([\d.]+)s/);
  if (!match) {
    return 0;
  }

  return Math.round(parseFloat(match[1]));
};

const buildRouteId = (index: number): string => `route-${index + 1}`;

const fetchRoutesV2 = async (origin: LatLng, destination: LatLng): Promise<RouteOption[]> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_MAPS_API_KEY_WARNING);
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: 'WALK',
      computeAlternativeRoutes: true,
      polylineEncoding: 'ENCODED_POLYLINE',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || ERROR_MESSAGES.NETWORK_ERROR);
  }

  const data = (await response.json()) as ComputeRoutesResponse;
  if (!data.routes || data.routes.length === 0) {
    throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
  }

  return data.routes.map((route, index) => {
    const encodedPolyline = route.polyline?.encodedPolyline ?? '';
    return {
      id: buildRouteId(index),
      distanceMeters: route.distanceMeters ?? 0,
      durationSeconds: parseDurationSeconds(route.duration),
      path: decodePolyline(encodedPolyline),
    };
  });
};

const fetchRoutesLegacy = async (origin: LatLng, destination: LatLng): Promise<RouteOption[]> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_MAPS_API_KEY_WARNING);
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=walking&alternatives=true&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  const data = (await response.json()) as LegacyDirectionsResponse;
  if (data.status !== 'OK' || data.routes.length === 0) {
    throw new Error(data.error_message || ERROR_MESSAGES.ROUTE_NOT_FOUND);
  }

  return data.routes.map((route, index) => {
    const leg = route.legs?.[0];
    const distanceMeters = leg?.distance?.value ?? 0;
    const durationSeconds = leg?.duration?.value ?? 0;
    const encoded = route.overview_polyline?.points ?? '';

    return {
      id: buildRouteId(index),
      distanceMeters,
      durationSeconds,
      path: decodePolyline(encoded),
    };
  });
};

const fetchRoutesWeb = async (origin: LatLng, destination: LatLng): Promise<RouteOption[]> => {
  const google = await loadGoogleMapsApi();
  const service = new google.maps.DirectionsService();

  const result = await service.route({
    origin: { lat: origin.latitude, lng: origin.longitude },
    destination: { lat: destination.latitude, lng: destination.longitude },
    travelMode: google.maps.TravelMode.WALKING,
    provideRouteAlternatives: true,
  });

  if (!result.routes || result.routes.length === 0) {
    throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
  }

  return result.routes.map((route, index) => {
    const legs = route.legs ?? [];
    const distanceMeters = legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
    const durationSeconds = legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);
    const overviewPath = route.overview_path ?? [];

    const path = overviewPath.map((point) => ({
      latitude: point.lat(),
      longitude: point.lng(),
    }));

    return {
      id: buildRouteId(index),
      distanceMeters,
      durationSeconds,
      path,
    };
  });
};

export const getWalkingRoutes = async (origin: LatLng, destination: LatLng): Promise<RouteOption[]> => {
  if (Platform.OS === 'web') {
    return fetchRoutesWeb(origin, destination);
  }

  try {
    return await fetchRoutesV2(origin, destination);
  } catch (error) {
    console.warn('Routes v2 failed, falling back to legacy API:', error);
    return await fetchRoutesLegacy(origin, destination);
  }
};
