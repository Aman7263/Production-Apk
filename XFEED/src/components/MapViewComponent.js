import React from "react"
import MapView, { Marker } from "react-native-maps"
import { View } from "react-native"

export default function MapViewComponent({ locations }) {

  if (!locations.length) return null

  const latest = locations[locations.length - 1]

  return (
    <View style={{ flex: 1 }}>

      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
      >

        {locations.map((loc, index) => (

          <Marker
            key={index}
            coordinate={{
              latitude: loc.latitude,
              longitude: loc.longitude
            }}
          />

        ))}

      </MapView>

    </View>
  )
}