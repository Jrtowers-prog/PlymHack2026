/**
 * Main map screen component displaying user location and destination selection.
 * Handles map interactions including long-press to drop destination pin.
 * 
 * WHY: Native implementation uses react-native-maps which is not supported on web.
 */

import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, LongPressEvent, Polyline } from 'react-native-maps';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';
import { useRoutes } from '@/src/hooks/useRoutes';
import { DestinationInput } from '@/src/components/map/DestinationInput';
import { MapRegion, LocationPermissionStatus } from '@/src/types/location';
import {
  DEFAULT_LONDON_REGION,
  USER_LOCATION_ZOOM,
  ROUTE_COLORS,
  ROUTE_STROKE_OPACITY,
  ROUTE_STROKE_WIDTH,
  ROUTE_FIT_PADDING,
} from '@/src/constants/map';
import { formatDistance, formatDuration } from '@/src/utils/format';

export const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView | null>(null);

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

  const [mapRegion, setMapRegion] = React.useState<MapRegion>(DEFAULT_LONDON_REGION);

  const selectedRoute = useMemo(() => {
    if (selectedRouteId) {
      return routes.find((route) => route.id === selectedRouteId) ?? null;
    }
    return routes[0] ?? null;
  }, [routes, selectedRouteId]);

  /**
   * Update map region when user location is obtained
   * WHY: Center map on user's actual position for better UX
   */
  useEffect(() => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        ...USER_LOCATION_ZOOM,
      });
    }
  }, [userLocation]);

  /**
   * Fit map to selected route when available
   */
  useEffect(() => {
    if (selectedRoute?.path.length && mapRef.current) {
      mapRef.current.fitToCoordinates(selectedRoute.path, {
        edgePadding: ROUTE_FIT_PADDING,
        animated: true,
      });
    }
  }, [selectedRoute]);

  /**
   * Show error alert if location fetch fails
   * WHY: User needs feedback when location cannot be obtained
   */
  useEffect(() => {
    if (locationError) {
      Alert.alert('Location Error', locationError);
    }
  }, [locationError]);

  /**
   * Show error alert if route fetch fails
   */
  useEffect(() => {
    if (routeError) {
      Alert.alert('Route Error', routeError);
    }
  }, [routeError]);

  /**
   * Handle long press on map to drop destination pin
   * WHY: Provides alternative to text input - user can visually select destination
   */
  const handleMapLongPress = useCallback(
    (event: LongPressEvent): void => {
      const { latitude, longitude } = event.nativeEvent.coordinate;

      void setDestinationByCoordinate(
        { latitude, longitude },
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      );
    },
    [setDestinationByCoordinate]
  );

  /**
   * Handle destination submission from text input
   * WHY: Process user-entered address for geocoding and route fetch
   */
  const handleDestinationSubmit = useCallback(
    async (address: string): Promise<void> => {
      await setDestinationByAddress(address);
    },
    [setDestinationByAddress]
  );

  /**
   * Handle initial permission request on component mount
   */
  useEffect(() => {
    if (permissionStatus === LocationPermissionStatus.UNDETERMINED) {
      requestPermission();
    }
  }, [permissionStatus, requestPermission]);

  // Show loading state while fetching location
  if (isLocationLoading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        onLongPress={handleMapLongPress}
        // Allow map region changes from user interaction
        onRegionChangeComplete={(region: Region) => {
          setMapRegion(region);
        }}
      >
        {/* User Location Marker - Redundant with showsUserLocation but explicit for clarity */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description={
              userLocation.accuracy ? `Accuracy: ${userLocation.accuracy.toFixed(0)}m` : undefined
            }
            pinColor="blue"
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            description={destination.name || 'Selected location'}
            pinColor="red"
          />
        )}

        {/* Route Polylines */}
        {routes
          .filter((route) => route.path.length > 0)
          .map((route, index) => {
            const isSelected = route.id === selectedRouteId;
            const color = ROUTE_COLORS[index % ROUTE_COLORS.length];

            return (
              <Polyline
                key={route.id}
                coordinates={route.path}
                strokeColor={color}
                strokeWidth={
                  isSelected ? ROUTE_STROKE_WIDTH.selected : ROUTE_STROKE_WIDTH.unselected
                }
                strokeOpacity={
                  isSelected ? ROUTE_STROKE_OPACITY.selected : ROUTE_STROKE_OPACITY.unselected
                }
                tappable={true}
                onPress={() => selectRoute(route.id)}
              />
            );
          })}
      </MapView>

      {/* Destination Input Overlay */}
      <View style={styles.inputContainer}>
        <DestinationInput
          onDestinationSubmit={handleDestinationSubmit}
          isLoading={isRoutingLoading}
          disabled={!userLocation}
          placeholder="Enter destination or long-press on map"
        />
      </View>

      {/* Route Info */}
      {selectedRoute && (
        <View style={styles.routeInfoContainer}>
          <Text style={styles.routeInfoTitle}>Selected Route</Text>
          <Text style={styles.routeInfoText}>
            {formatDistance(selectedRoute.distanceMeters)} •{' '}
            {formatDuration(selectedRoute.durationSeconds)}
          </Text>
          {routes.length > 1 && (
            <Text style={styles.routeInfoHint}>Tap a route line to compare options</Text>
          )}
        </View>
      )}

      {/* Refresh Location Button */}
      {userLocation && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshLocation}
          disabled={isLocationLoading}
          accessibilityRole="button"
          accessibilityLabel="Refresh location"
        >
          <Text style={styles.refreshButtonText}>{isLocationLoading ? '⟳' : '📍'}</Text>
        </TouchableOpacity>
      )}

      {/* Loading overlay for routing */}
      {isRoutingLoading && (
        <View style={styles.routingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding routes...</Text>
        </View>
      )}

      {/* Info Text for Long Press */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Tip: Long-press on the map to set destination</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
