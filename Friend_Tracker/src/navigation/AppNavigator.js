import { createStackNavigator } from "@react-navigation/stack"

import LoginScreen from "../screens/LoginScreen"
import HomeScreen from "../screens/HomeScreen"
import LiveTrackingScreen from "../screens/LiveTrackingScreen"
import NewsScreen from "../screens/NewsScreen"
import ChatScreen from "../screens/ChatScreen"

const Stack = createStackNavigator()

export default function AppNavigator() {

  return (
    <Stack.Navigator>

      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Tracking" component={LiveTrackingScreen} />

      <Stack.Screen name="News" component={NewsScreen} />

      <Stack.Screen name="Chat" component={ChatScreen} />

    </Stack.Navigator>
  )
}