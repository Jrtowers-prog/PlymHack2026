declare module 'react-native-maps' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export const PROVIDER_GOOGLE: string;

  export type LatLng = { latitude: number; longitude: number };

  export interface MapViewProps extends ViewProps {
    provider?: any;
    region?: any;
    style?: any;
    accessible?: boolean;
    accessibilityLabel?: string;
  }

  export default class MapView extends React.Component<MapViewProps> {}

  export class Marker extends React.Component<{
    coordinate: LatLng;
    title?: string;
  } & ViewProps> {}

  export class Polyline extends React.Component<{
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
    lineJoin?: string;
  } & ViewProps> {}
}
