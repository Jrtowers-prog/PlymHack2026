// src/hooks/useDirections.ts
import { useState } from 'react';
import { LatLng, DirectionsResult } from '../types/navigation';
import * as directionsService from '../services/directionsService';
import { ServiceError } from '../services/errors';

export function useDirections() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DirectionsResult | null>(null);

  async function fetchForAddress(origin: LatLng, destinationAddress: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await directionsService.fetchDirectionsByAddress(origin, destinationAddress);
      setData(res);
      return res;
    } catch (err: any) {
      if (err instanceof ServiceError) {
        setError(err.message);
      } else {
        setError(err?.message ?? 'Unknown error fetching directions');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, data, fetchForAddress } as const;
}
