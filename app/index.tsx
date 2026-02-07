/**
 * Main entry point for the SafeRoute app.
 * Uses platform file resolution for MapScreen (.web/.native).
 */

import React from 'react';
import { MapScreen } from '@/src/components/map/MapScreen';

export default function App() {
  return <MapScreen />;
}
