import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen({ route }) {
  const { latitude, longitude } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Saved Location"
          description="Checkmark here!"
        >
          {/* Custom checkmark icon (use an image or emoji) */}
          <Text>✅</Text> {/* Simple checkmark; replace with Image for custom icon */}
        </Marker>
      </MapView>
    </View>
  );
}