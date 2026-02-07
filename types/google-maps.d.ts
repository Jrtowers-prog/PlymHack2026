declare namespace google.maps {
  export type LatLngLiteral = { lat: number; lng: number };
  export interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
  }
  export class Map {
    constructor(el: Element, opts?: MapOptions);
    setCenter(latLng: LatLngLiteral): void;
    setZoom(z: number): void;
  }
  export interface MarkerOptions { position: LatLngLiteral; map?: Map; title?: string }
  export class Marker { constructor(opts: MarkerOptions); setMap(map: Map | null): void }
  export interface PolylineOptions { path: LatLngLiteral[]; strokeColor?: string; strokeOpacity?: number; strokeWeight?: number }
  export class Polyline { constructor(opts: PolylineOptions); setMap(map: Map | null): void }
}
