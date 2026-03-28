import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginSignup from '../screens/LoginSignup';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import Chat from '../screens/Chat';
import ProfileScreen from '../screens/ProfileScreen';
import LocationMap from '../screens/LocationMap';
import AskScreen from '../screens/AskScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentHistory from '../screens/PaymentHistory';

import Header from '../components/Header';
import Footer from '../components/Footer';

import { supabase } from '../config/supabase';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {session && <Header />}

        <View style={{ flex: 1 }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="MapScreen" component={MapScreen} />
                <Stack.Screen name="Chat" component={Chat} />
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                <Stack.Screen name="LocationMap" component={LocationMap} />
                <Stack.Screen name="AskScreen" component={AskScreen} />
                <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
                <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginSignup} />
            )}
          </Stack.Navigator>
        </View>

        {session && <Footer />}
      </View>
    </NavigationContainer>
  );
}