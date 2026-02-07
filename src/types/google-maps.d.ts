/**
 * TypeScript declarations for Google Maps JavaScript API.
 * WHY: Provides type safety when using the Google Maps API in web environment.
 */

/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
