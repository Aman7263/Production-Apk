import React from "react"
import { StatusBar } from "expo-status-bar"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ThemeColors } from "./src/theme"
import { StyleSheet, View } from "react-native"

import Dashboard from "./src/screens/Dashboard"
import Products from "./src/screens/Products"
import Admin from "./src/screens/Admin"
import AddProduct from "./src/screens/AddProduct"

const Stack = createNativeStackNavigator()

export default function App() {

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

          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Products" component={Products} />
          <Stack.Screen name="Admin" component={Admin} />
          <Stack.Screen name="AddProduct" component={AddProduct} />

        </Stack.Navigator>

      </NavigationContainer>
    </>
  )

}