import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from 'expo-location';
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from '../config/supabase';

export default function LocationMap() {
  const { theme } = useTheme();
  const [location, setLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pData } = await supabase.from('partners').select('partner_id, linked_id').eq('user_id', user.id).single();
      const mappedPartnerId = pData ? pData.partner_id : null;
      const linkedId = pData ? pData.linked_id : null;

      // Start watching location
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (loc) => {
          const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setLocation(newLoc);
          
          // Update my live location using user_id as conflict target
          await supabase.from('live_tracking').upsert({
            user_id: user.id,
            partner_id: mappedPartnerId,
            latitude: newLoc.latitude,
            longitude: newLoc.longitude,
            updated_at: new Date()
          }, { onConflict: 'user_id' });

          // Fetch partner location securely querying ONLY their dedicated linked coordinate
          if (linkedId) {
            const { data: partnerLocData } = await supabase
              .from('live_tracking')
              .select('*')
              .eq('partner_id', linkedId)
              .single();

            if (partnerLocData) {
              const pLoc = { latitude: partnerLocData.latitude, longitude: partnerLocData.longitude };
              setPartnerLocation(pLoc);
              setDistance(calculateDistance(newLoc.latitude, newLoc.longitude, pLoc.latitude, pLoc.longitude));
            }
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return (R * c).toFixed(2); // Distance in km
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Floating Distance Indicator */}
      {partnerLocation && (
        <View style={[styles.floatingCard, { backgroundColor: theme.card, borderColor: theme.glow }]}>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>
            📍 Distance to Partner: {distance} km
          </Text>
        </View>
      )}

      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={location} title="You" pinColor="blue" />
          
          {partnerLocation && (
            <>
              <Marker coordinate={partnerLocation} title="Partner" pinColor="red" />
              <Polyline
                coordinates={[location, partnerLocation]}
                strokeColor="#000"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text style={{ color: theme.text }}>Fetching Location...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCard: { 
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    zIndex: 100, 
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  map: { width: Dimensions.get('window').width, flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});