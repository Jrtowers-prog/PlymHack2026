// src/types/navigation.ts
export type LatLng = { latitude: number; longitude: number };

export type RouteShape = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LatLng[]; // decoded polyline points
};

export type DirectionsResult = {
  routes: RouteShape[];
};
