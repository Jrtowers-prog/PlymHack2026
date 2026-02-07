/**
 * Route-related type definitions.
 *
 * WHY: Keeps routing data structures consistent across services, hooks, and UI.
 */

import type { LatLng } from '@/src/types/location';

export interface RouteOption {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  path: LatLng[];
}
