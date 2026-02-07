/**
 * Destination input component for entering/searching destination address.
 * Provides simple text input for MVP with placeholder for future autocomplete.
 * 
 * WHY: Separates destination input logic from map display for better component organization.
 * Future enhancement: Google Places Autocomplete will be integrated here (Hour 2-3).
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface DestinationInputProps {
  onDestinationSubmit: (address: string) => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const DestinationInput: React.FC<DestinationInputProps> = ({
  onDestinationSubmit,
  isLoading = false,
  placeholder = 'Enter destination address',
  disabled = false,
}) => {
  const [destination, setDestination] = useState<string>('');

  const handleSubmit = (): void => {
    if (destination.trim()) {
      void onDestinationSubmit(destination.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!isLoading && !disabled}
      />
      <TouchableOpacity
        style={[styles.button, (isLoading || disabled) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || disabled || !destination.trim()}
        accessibilityRole="button"
        accessibilityLabel="Search destination"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Go</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
