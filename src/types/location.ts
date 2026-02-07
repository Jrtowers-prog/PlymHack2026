/**
 * Location-related type definitions for the SafeRoute app.
 * These types ensure type safety across location, map regions, and destination handling.
 */

/**
 * Generic latitude/longitude coordinate pair
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * User's current location coordinates
 */
export interface UserLocation extends LatLng {
  accuracy: number | null;
  timestamp: number;
}

/**
 * Map region defining the visible area and zoom level
 */
export interface MapRegion extends LatLng {
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Destination point selected by user (either via search or map pin)
 */
export interface DestinationPoint extends LatLng {
  name?: string; // Optional address/place name
}

/**
 * Location permission status states
 */
export enum LocationPermissionStatus {
  UNDETERMINED = 'undetermined',
  GRANTED = 'granted',
  DENIED = 'denied',
}
