/**
 * Platform wrapper for MapScreen to avoid importing react-native-maps on web.
 */

import type { ComponentType } from 'react';
import { Platform } from 'react-native';

type MapScreenComponent = ComponentType;

const getMapScreen = (): MapScreenComponent => {
  if (Platform.OS === 'web') {
    return require('./MapScreen.web').MapScreen as MapScreenComponent;
  }
  return require('./MapScreen.native').MapScreen as MapScreenComponent;
};

const MapScreen = getMapScreen();

export { MapScreen };
