import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, TextInput, Button } from 'react-native';
import { Platform } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useDirections } from '../src/hooks/useDirections';

export default function App() {
  const { loading, error, coords } = useLocation();
  const { loading: dirLoading, error: dirError, data, fetchForAddress } = useDirections();
  const [destination, setDestination] = useState('');

  async function handleFetch() {
    if (!coords) {
      Alert.alert('No location', 'Current location is not available');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Enter destination', 'Please type a destination address');
      return;
    }
    await fetchForAddress(coords, destination.trim());
  }

  if (loading) {
    return (
      <View style={styles.full}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Requesting location permission…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.full}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  const routes = data?.routes ?? [];

  const isWeb = Platform.OS === 'web';
  let NativeMapView: any = null;
  let NativeMarker: any = null;
  let NativePolyline: any = null;
  if (!isWeb) {
    try {
      // require at runtime to avoid importing native-only module on web bundlers
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const maps = require('react-native-maps');
      NativeMapView = maps.default ?? maps;
      NativeMarker = maps.Marker;
      NativePolyline = maps.Polyline;
    } catch (e) {
      console.warn('react-native-maps could not be loaded', e);
    }
  }

  let WebMap: any = null;
  if (isWeb) {
    // lazy import local WebMap component (safe on web)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    WebMap = require('../src/components/WebMap').default;
  }

  return (
    <View style={styles.full}>
      {isWeb ? (
        WebMap ? (
          <View style={styles.map}>
            <WebMap center={coords} routes={routes} />
          </View>
        ) : (
          <View style={[styles.map, styles.webFallback]}>
            <Text style={{ textAlign: 'center' }}>
              Map is not available on web due to an initialization error.
            </Text>
          </View>
        )
      ) : (
        <NativeMapView
          provider={NativeMapView.PROVIDER_GOOGLE}
          style={styles.map}
          region={
            coords
              ? {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
          accessible
          accessibilityLabel="Map showing your location"
        >
          {coords && <NativeMarker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} title="You" />}
          {routes.map((r) => (
            <NativePolyline
              key={r.id}
              coordinates={r.coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineJoin="round"
            />
          ))}
        </NativeMapView>
      )}

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="Enter destination address"
          value={destination}
          onChangeText={setDestination}
          accessibilityLabel="Destination address"
        />
        <View style={styles.buttonRow}>
          <Button title={dirLoading ? 'Searching…' : 'Find routes'} onPress={handleFetch} disabled={dirLoading} />
        </View>
        {dirError ? <Text style={styles.errorSmall}>Route error: {dirError}</Text> : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  full: { flex: 1 },
  map: { flex: 1 },
  webFallback: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  controls: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    height: 44,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  message: { marginTop: 8, color: '#555', textAlign: 'center' },
  error: { color: 'red', fontSize: 16, textAlign: 'center' },
  errorSmall: { color: 'red', fontSize: 12, marginTop: 8 },
});
