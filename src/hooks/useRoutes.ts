/**
 * Hook for destination geocoding and route fetching.
 *
 * WHY: Keeps async routing state isolated from UI and enables reuse across platforms.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DestinationPoint, LatLng } from '@/src/types/location';
import type { RouteOption } from '@/src/types/routes';
import { geocodeAddress } from '@/src/services/maps/geocodingService';
import { getWalkingRoutes } from '@/src/services/maps/directionsService';
import { ERROR_MESSAGES } from '@/src/constants/messages';

interface UseRoutesReturn {
  destination: DestinationPoint | null;
  routes: RouteOption[];
  selectedRouteId: string | null;
  isLoading: boolean;
  error: string | null;
  setDestinationByAddress: (address: string) => Promise<void>;
  setDestinationByCoordinate: (coordinate: LatLng, name?: string) => Promise<void>;
  selectRoute: (routeId: string) => void;
  clearRoutes: () => void;
  refetchRoutes: () => Promise<void>;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const useRoutes = (origin: LatLng | null): UseRoutesReturn => {
  const [destination, setDestination] = useState<DestinationPoint | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastOriginRef = useRef<LatLng | null>(origin);

  const updateRoutes = useCallback(
    async (routeOrigin: LatLng, routeDestination: DestinationPoint): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const nextRoutes = await getWalkingRoutes(routeOrigin, routeDestination);
        setRoutes(nextRoutes);
        setSelectedRouteId(nextRoutes[0]?.id ?? null);
      } catch (err) {
        setRoutes([]);
        setSelectedRouteId(null);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setDestinationByAddress = useCallback(
    async (address: string): Promise<void> => {
      if (!origin) {
        setError(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const geocodedDestination = await geocodeAddress(address);
        setDestination(geocodedDestination);
        const nextRoutes = await getWalkingRoutes(origin, geocodedDestination);
        setRoutes(nextRoutes);
        setSelectedRouteId(nextRoutes[0]?.id ?? null);
      } catch (err) {
        setRoutes([]);
        setSelectedRouteId(null);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [origin]
  );

  const setDestinationByCoordinate = useCallback(
    async (coordinate: LatLng, name?: string): Promise<void> => {
      if (!origin) {
        setError(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
        return;
      }

      const nextDestination: DestinationPoint = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name,
      };

      setDestination(nextDestination);
      await updateRoutes(origin, nextDestination);
    },
    [origin, updateRoutes]
  );

  const selectRoute = useCallback((routeId: string): void => {
    setSelectedRouteId(routeId);
  }, []);

  const clearRoutes = useCallback((): void => {
    setRoutes([]);
    setDestination(null);
    setSelectedRouteId(null);
    setError(null);
  }, []);

  const refetchRoutes = useCallback(async (): Promise<void> => {
    if (!origin || !destination) {
      return;
    }

    await updateRoutes(origin, destination);
  }, [origin, destination, updateRoutes]);

  useEffect(() => {
    if (!origin) {
      lastOriginRef.current = origin;
      return;
    }

    const lastOrigin = lastOriginRef.current;
    const originChanged =
      !lastOrigin ||
      lastOrigin.latitude !== origin.latitude ||
      lastOrigin.longitude !== origin.longitude;

    if (originChanged && destination) {
      updateRoutes(origin, destination).catch((err) => {
        setError(getErrorMessage(err));
      });
    }

    lastOriginRef.current = origin;
  }, [origin, destination, updateRoutes]);

  return {
    destination,
    routes,
    selectedRouteId,
    isLoading,
    error,
    setDestinationByAddress,
    setDestinationByCoordinate,
    selectRoute,
    clearRoutes,
    refetchRoutes,
  };
};
