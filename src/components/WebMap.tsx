import React, { useEffect, useRef } from 'react';
import { requireGoogleMapsKey } from '../config/env';
import { LatLng, RouteShape } from '../types/navigation';

type Props = {
  center?: LatLng | null;
  routes: RouteShape[];
};

function loadGoogleMaps(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    // already loaded
    // @ts-ignore
    if (window.google && window.google.maps) return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export default function WebMap({ center, routes }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const key = requireGoogleMapsKey(); // throws if missing
        await loadGoogleMaps(key);
        if (!mounted) return;
        // @ts-ignore
        const googleMap = new window.google.maps.Map(containerRef.current as Element, {
          center: center ? { lat: center.latitude, lng: center.longitude } : { lat: 0, lng: 0 },
          zoom: center ? 15 : 2,
        });
        mapRef.current = googleMap;
      } catch (err) {
        // show console guidance; UI stays with container
        // eslint-disable-next-line no-console
        console.error('Failed to load Google Maps', err);
      }
    })();
    return () => {
      mounted = false;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    // clear previous overlays by recreating map? Simpler: keep references (omitted) — just add overlays.
    // Add marker for center
    // @ts-ignore
    if (center) {
      // @ts-ignore
      new window.google.maps.Marker({ position: { lat: center.latitude, lng: center.longitude }, map: mapRef.current, title: 'You' });
      // @ts-ignore
      mapRef.current.setCenter({ lat: center.latitude, lng: center.longitude });
      // @ts-ignore
      mapRef.current.setZoom(15);
    }

    // Draw routes
    routes.forEach((r) => {
      const path = r.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }));
      // @ts-ignore
      new window.google.maps.Polyline({ path, strokeColor: '#007AFF', strokeOpacity: 0.9, strokeWeight: 4, map: mapRef.current });
    });
  }, [center, routes]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
