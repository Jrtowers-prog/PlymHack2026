declare module 'expo-location' {
  export const Accuracy: {
    Highest: string;
  };

  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function getCurrentPositionAsync(options?: any): Promise<{ coords: { latitude: number; longitude: number } }>;

  const _default: any;
  export default _default;
}
