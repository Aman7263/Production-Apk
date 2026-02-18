import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebase';

export default function ViewScreen({ navigation }) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'locations'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setLocations(data);
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Map', { latitude: item.latitude, longitude: item.longitude })}
      style={{ padding: 10, borderBottomWidth: 1 }}
    >
      <Text style={{ fontSize: 14, color: 'gray' }}>{item.timestamp}</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList data={locations} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  );
}