/**
 * Map-related constants for default regions, zoom levels, and map configuration.
 * These values provide sensible defaults for the London-focused SafeRoute app.
 */

import { MapRegion } from '@/src/types/location';

/**
 * Default map region centered on Central London
 * Used as fallback when user location is unavailable
 */
export const DEFAULT_LONDON_REGION: MapRegion = {
  latitude: 51.5074, // Central London
  longitude: -0.1278,
  latitudeDelta: 0.05, // Roughly 5.5 km span
  longitudeDelta: 0.05,
};

/**
 * Zoom level for focusing on user's current location
 * Smaller delta = closer zoom
 */
export const USER_LOCATION_ZOOM: Pick<MapRegion, 'latitudeDelta' | 'longitudeDelta'> = {
  latitudeDelta: 0.01, // Roughly 1.1 km span
  longitudeDelta: 0.01,
};

/**
 * Minimum distance (in meters) for location update accuracy
 */
export const MIN_LOCATION_ACCURACY = 100;

/**
 * Timeout for location fetch (milliseconds)
 */
export const LOCATION_TIMEOUT = 10000; // 10 seconds

/**
 * Route rendering styles
 * Shared across native and web implementations.
 */
export const ROUTE_COLORS = ['#0A84FF', '#34C759', '#FF9F0A', '#AF52DE'];
export const ROUTE_STROKE_WIDTH = {
  selected: 6,
  unselected: 4,
};
export const ROUTE_STROKE_OPACITY = {
  selected: 0.9,
  unselected: 0.5,
};

/**
 * Edge padding for fitting route bounds on native maps.
 */
export const ROUTE_FIT_PADDING = {
  top: 120,
  right: 60,
  bottom: 220,
  left: 60,
};
