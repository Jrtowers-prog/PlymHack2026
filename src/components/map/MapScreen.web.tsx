/**
 * Web implementation of MapScreen using Google Maps JavaScript API.
 * WHY: react-native-maps is not supported on web; use Google Maps JS API for compatibility.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';
import { useRoutes } from '@/src/hooks/useRoutes';
import { DestinationInput } from './DestinationInput';
import { DEFAULT_LONDON_REGION, ROUTE_COLORS, ROUTE_STROKE_OPACITY, ROUTE_STROKE_WIDTH } from '@/src/constants/map';
import { formatDistance, formatDuration } from '@/src/utils/format';
import { loadGoogleMapsApi } from '@/src/services/maps/googleMapsWebLoader';
import { LocationPermissionStatus } from '@/src/types/location';

const MAP_CONTAINER_ID = 'saferoute-google-map';

export const MapScreen: React.FC = () => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);

  const {
    permissionStatus,
    userLocation,
    locationError,
    isLoading: isLocationLoading,
    requestPermission,
    refreshLocation,
  } = useLocationPermission();

  const {
    destination,
    routes,
    selectedRouteId,
    isLoading: isRoutingLoading,
    error: routeError,
    setDestinationByAddress,
    setDestinationByCoordinate,
    selectRoute,
  } = useRoutes(userLocation);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const selectedRoute = useMemo(() => {
    if (selectedRouteId) {
      return routes.find((route) => route.id === selectedRouteId) ?? null;
    }
    return routes[0] ?? null;
  }, [routes, selectedRouteId]);

  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true;
    let clickListener: google.maps.MapsEventListener | null = null;

    const initMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!isMounted) {
          return;
        }

        if (typeof document === 'undefined') {
          return;
        }

        const mapElement = document.getElementById(MAP_CONTAINER_ID);
        if (!mapElement || !(mapElement instanceof HTMLElement)) {
          return;
        }

        if (mapRef.current) {
          return;
        }

        const map = new google.maps.Map(mapElement, {
          center: {
            lat: DEFAULT_LONDON_REGION.latitude,
            lng: DEFAULT_LONDON_REGION.longitude,
          },
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapRef.current = map;

        clickListener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) {
            return;
          }

          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          void setDestinationByCoordinate(
            { latitude: lat, longitude: lng },
            `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          );
        });

        setIsMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        Alert.alert('Map Error', 'Failed to load Google Maps. Please check your API key.');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (clickListener) {
        clickListener.remove();
      }
    };
  }, [setDestinationByCoordinate]);

  // Update user location marker
  useEffect(() => {
    if (isMapLoaded && mapRef.current && userLocation) {
      const position = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      };

      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(position);
      } else {
        userMarkerRef.current = new google.maps.Marker({
          position,
          map: mapRef.current,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }

      mapRef.current.setCenter(position);
      mapRef.current.setZoom(15);
    }
  }, [isMapLoaded, userLocation]);

  // Update destination marker
  useEffect(() => {
    if (isMapLoaded && mapRef.current && destination) {
      const position = {
        lat: destination.latitude,
        lng: destination.longitude,
      };

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setPosition(position);
      } else {
        destinationMarkerRef.current = new google.maps.Marker({
          position,
          map: mapRef.current,
          title: destination.name || 'Destination',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EA4335',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }
    }
  }, [isMapLoaded, destination]);

  // Render route polylines
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) {
      return;
    }

    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    routePolylinesRef.current = [];

    routes
      .filter((route) => route.path.length > 0)
      .forEach((route, index) => {
        const isSelected = route.id === selectedRouteId;
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];

        const polyline = new google.maps.Polyline({
          path: route.path.map((point) => ({ lat: point.latitude, lng: point.longitude })),
          strokeColor: color,
          strokeOpacity: isSelected
            ? ROUTE_STROKE_OPACITY.selected
            : ROUTE_STROKE_OPACITY.unselected,
          strokeWeight: isSelected ? ROUTE_STROKE_WIDTH.selected : ROUTE_STROKE_WIDTH.unselected,
        });

        polyline.addListener('click', () => {
          selectRoute(route.id);
        });

        polyline.setMap(mapRef.current);
        routePolylinesRef.current.push(polyline);
      });
  }, [isMapLoaded, routes, selectedRouteId, selectRoute]);

  // Fit map to selected route
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !selectedRoute) {
      return;
    }

    if (selectedRoute.path.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    selectedRoute.path.forEach((point) => {
      bounds.extend({ lat: point.latitude, lng: point.longitude });
    });

    mapRef.current.fitBounds(bounds, 80);
  }, [isMapLoaded, selectedRoute]);

  const handleDestinationSubmit = useCallback(
    async (address: string) => {
      await setDestinationByAddress(address);
    },
    [setDestinationByAddress]
  );

  const handleRefreshLocation = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    if (locationError) {
      Alert.alert('Location Error', locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (routeError) {
      Alert.alert('Route Error', routeError);
    }
  }, [routeError]);

  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <DestinationInput
          onDestinationSubmit={handleDestinationSubmit}
          isLoading={isRoutingLoading}
          disabled={!userLocation}
          placeholder="Enter destination or click on map"
        />
      </View>

      <View style={styles.mapContainer} nativeID={MAP_CONTAINER_ID} />

      {!isMapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {permissionStatus !== LocationPermissionStatus.GRANTED && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Location permission is required to show your position on the map.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>
              {isLocationLoading ? 'Requesting...' : 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedRoute && (
        <View style={styles.routeInfoContainer}>
          <Text style={styles.routeInfoTitle}>Selected Route</Text>
          <Text style={styles.routeInfoText}>
            {formatDistance(selectedRoute.distanceMeters)} •{' '}
            {formatDuration(selectedRoute.durationSeconds)}
          </Text>
          {routes.length > 1 && (
            <Text style={styles.routeInfoHint}>Click a route line to compare options</Text>
          )}
        </View>
      )}

      {userLocation && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation}>
          <Text style={styles.refreshButtonText}>📍</Text>
        </TouchableOpacity>
      )}

      {isRoutingLoading && (
        <View style={styles.routingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding routes...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  routeInfoText: {
    marginTop: 4,
    fontSize: 16,
    color: '#111',
  },
  routeInfoHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  routingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
