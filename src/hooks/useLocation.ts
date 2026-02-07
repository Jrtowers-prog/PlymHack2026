// src/hooks/useLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { LatLng } from '../types/navigation';

export function useLocation() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setError('Permission to access location was denied');
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (mounted) setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unknown location error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error, coords } as const;
}
