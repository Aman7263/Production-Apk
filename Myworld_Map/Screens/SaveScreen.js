import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import * as Location from 'expo-location';
import { db, auth } from '../firebase';

export default function SaveScreen({ navigation }) {
  const [description, setDescription] = useState('');

  const getAndSaveCoordinate = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is required.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = location.coords;
    const timestamp = new Date().toISOString();

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save locations.');
        navigation.navigate('Auth');
        return;
      }
      await addDoc(collection(db, 'users', user.uid, 'locations'), {
        description,
        latitude,
        longitude,
        timestamp,
      });
      Alert.alert('Success', 'Location saved!');
      setDescription('');
      navigation.navigate('View');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Get Coordinate and Save" onPress={getAndSaveCoordinate} />
      <Button title="View Saved Locations" onPress={() => navigation.navigate('View')} />
    </View>
  );
}