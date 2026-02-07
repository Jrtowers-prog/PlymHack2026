// App config with environment-based API keys.
// TODO: Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env or EAS environment variables.

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const androidPermissions = new Set([...(config.android?.permissions ?? [])]);
  androidPermissions.add('ACCESS_COARSE_LOCATION');
  androidPermissions.add('ACCESS_FINE_LOCATION');

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      googleMapsApiKey,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        NSLocationWhenInUseUsageDescription:
          'SafeRoute uses your location to show your position on the map and plan routes.',
      },
    },
    android: {
      ...config.android,
      permissions: Array.from(androidPermissions),
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
