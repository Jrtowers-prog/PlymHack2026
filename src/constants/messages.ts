/**
 * User-facing messages, disclaimers, and error texts.
 * Centralized for consistency and easy updates.
 */

/**
 * Safety disclaimer shown to users when requesting location permission.
 * Critical for legal/ethical compliance - users must understand limitations.
 */
export const SAFETY_DISCLAIMER = `Welcome to SafeRoute

This app helps you find safer walking routes in London using crime data, lighting information, and other safety signals.

IMPORTANT DISCLAIMER:
• No route is 100% safe. This app provides guidance based on available data, not guarantees.
• Always stay aware of your surroundings and use your own judgment.
• We use your location only for routing and do not store it persistently.
• Data is for informational purposes and may not reflect real-time conditions.

By using this app, you acknowledge these limitations.`;

/**
 * Error messages for location-related issues
 */
export const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Location permission is required to show routes from your current position. Please enable location access in Settings.',
  LOCATION_UNAVAILABLE: 'Unable to get your current location. Please check your device settings and try again.',
  LOCATION_TIMEOUT: 'Location request timed out. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  GEOCODING_NO_RESULTS: 'No results found for that address. Please try a more specific location.',
  GEOCODING_FAILED: 'Unable to find that destination. Please try again.',
  ROUTE_NOT_FOUND: 'No walking routes found for that destination.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  LOCATION_UPDATED: 'Location updated',
  DESTINATION_SET: 'Destination set',
} as const;
