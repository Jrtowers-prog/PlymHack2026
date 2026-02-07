/**
 * Web entry point for the SafeRoute app.
 * WHY: Use the web-specific MapScreen implementation backed by Google Maps JS API.
 */

import React from 'react';
import { MapScreen } from '@/src/components/map/MapScreen.web';

export default function App() {
  return <MapScreen />;
}
