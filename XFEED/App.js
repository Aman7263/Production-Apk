import React, { useState, useEffect } from "react"
import { StatusBar } from "expo-status-bar"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ThemeColors, GlobalStyles } from "./src/theme"
import { StyleSheet, View, ActivityIndicator } from "react-native"
import { supabase } from "./src/service/supabase"

import Dashboard from "./src/screens/Dashboard"
import Products from "./src/screens/Products"
import Admin from "./src/screens/Admin"
import AddProduct from "./src/screens/AddProduct"
import Auth from "./src/screens/Auth"

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitializing(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const customTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: ThemeColors.background,
      card: ThemeColors.surfaceDark,
      text: ThemeColors.text,
      border: 'transparent',
    },
  };

  if (initializing) {
    return (
      <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={customTheme}>

        <Stack.Navigator
          screenOptions={{
            headerTransparent: true,
            headerBackground: () => (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.8)' }]} />
            ),
            headerTintColor: ThemeColors.text,
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 20,
            },
          }}
        >

          {session && session.user ? (
            <>
              <Stack.Screen name="Dashboard" component={Dashboard} />
              <Stack.Screen name="Products" component={Products} />
              <Stack.Screen name="Admin" component={Admin} />
              <Stack.Screen name="AddProduct" component={AddProduct} />
            </>
          ) : (
            <Stack.Screen 
              name="Auth" 
              component={Auth} 
              options={{ headerShown: false }} 
            />
          )}

        </Stack.Navigator>

      </NavigationContainer>
    </>
  )
}