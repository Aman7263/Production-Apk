import React from 'react';
import { createStackNavigator } from "@react-navigation/stack"
import { useTheme } from "../Theme/ThemeContext"
import { BlurView } from 'expo-blur';
import GradientText from '../components/GradientText';

import LoginScreen from "../screens/LoginScreen"
import HomeScreen from "../screens/HomeScreen"
import LiveTrackingScreen from "../screens/LiveTrackingScreen"
import NewsScreen from "../screens/NewsScreen"
import ChatScreen from "../screens/ChatScreen"

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { theme } = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerBackground: () => (
          <BlurView 
            tint="dark" 
            intensity={80} 
            style={{ flex: 1, backgroundColor: theme.header }} 
          />
        ),
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: theme.glow,
        },
        headerTintColor: theme.text,
        headerTitle: ({ children }) => (
          <GradientText style={{ fontSize: 20, fontWeight: 'bold' }}>
            {children}
          </GradientText>
        )
      }}
    >

      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Tracking" component={LiveTrackingScreen} />

      <Stack.Screen name="News" component={NewsScreen} />

      <Stack.Screen name="Chat" component={ChatScreen} />

    </Stack.Navigator>
  )
}