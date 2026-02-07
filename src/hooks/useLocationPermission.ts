/**
 * Custom hook for managing location permissions with user disclaimer.
 * Handles permission requests, status tracking, and user location fetching.
 * 
 * WHY: Centralizes permission logic to avoid repetition and ensure consistent
 * disclaimer presentation across the app.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { UserLocation, LocationPermissionStatus } from '@/src/types/location';
import { SAFETY_DISCLAIMER, ERROR_MESSAGES } from '@/src/constants/messages';
import { LOCATION_TIMEOUT } from '@/src/constants/map';

interface UseLocationPermissionReturn {
  permissionStatus: LocationPermissionStatus;
  userLocation: UserLocation | null;
  locationError: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export const useLocationPermission = (): UseLocationPermissionReturn => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>(
    LocationPermissionStatus.UNDETERMINED
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Check current permission status on mount
   * WHY: Need to know if we already have permission before requesting
   */
  const checkExistingPermission = useCallback(async (): Promise<void> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionStatus(LocationPermissionStatus.GRANTED);
        // Automatically fetch location if permission already granted
        await fetchUserLocation();
      } else if (status === 'denied') {
        setPermissionStatus(LocationPermissionStatus.DENIED);
      } else {
        setPermissionStatus(LocationPermissionStatus.UNDETERMINED);
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
      setLocationError(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }, []);

  useEffect(() => {
    checkExistingPermission();
  }, [checkExistingPermission]);

  /**
   * Request location permission with disclaimer
   * WHY: Users must be informed about data usage and safety limitations before granting access
   */
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setLocationError(null);

      // Show disclaimer before requesting permission
      // WHY: Ethical and legal requirement to inform users about app limitations
      await showDisclaimerAlert();

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setPermissionStatus(LocationPermissionStatus.GRANTED);
        await fetchUserLocation();
      } else {
        setPermissionStatus(LocationPermissionStatus.DENIED);
        setLocationError(ERROR_MESSAGES.PERMISSION_DENIED);
        
        // Guide user to settings if they denied permission
        showPermissionDeniedAlert();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setLocationError(ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch current user location
   * WHY: Get high-accuracy GPS coordinates for route origin
   */
  const fetchUserLocation = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setLocationError(null);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: LOCATION_TIMEOUT,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      
      // Provide specific error message based on error type
      if ((error as Error).message?.includes('timeout')) {
        setLocationError(ERROR_MESSAGES.LOCATION_TIMEOUT);
      } else {
        setLocationError(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user location (for manual updates)
   */
  const refreshLocation = useCallback(async (): Promise<void> => {
    if (permissionStatus === LocationPermissionStatus.GRANTED) {
      await fetchUserLocation();
    } else {
      await requestPermission();
    }
  }, [permissionStatus, requestPermission]);

  /**
   * Show disclaimer alert before permission request
   */
  const showDisclaimerAlert = (): Promise<void> => {
    return new Promise((resolve) => {
      Alert.alert(
        'SafeRoute',
        SAFETY_DISCLAIMER,
        [
          {
            text: 'I Understand',
            onPress: () => resolve(),
          },
        ],
        { cancelable: false }
      );
    });
  };

  /**
   * Show alert when permission is denied with guidance to settings
   */
  const showPermissionDeniedAlert = (): void => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access in your browser settings to use routing features.'
      );
      return;
    }

    Alert.alert(
      'Location Permission Required',
      ERROR_MESSAGES.PERMISSION_DENIED,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings().catch((error) => {
              console.warn('Unable to open settings:', error);
            });
          },
        },
      ]
    );
  };

  return {
    permissionStatus,
    userLocation,
    locationError,
    isLoading,
    requestPermission,
    refreshLocation,
  };
};
