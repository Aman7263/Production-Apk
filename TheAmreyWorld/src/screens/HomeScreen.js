import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../Theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GradientText from '../components/GradientText';

export default function HomeScreen({ navigation }) {
  const { theme  } = useTheme();

  const menu = [
    { name: "Map", screen: "MapScreen", icon: "📍" },
    { name: "Chat", screen: "Chat", icon: "💬" },
    { name: "Tracking", screen: "LocationMap", icon: "🗺️" },
    { name: "Notifications", screen: "NotificationsScreen", icon: "🔔" },
    { name: "Profile", screen: "ProfileScreen", icon: "👤" }
  ];

  return (
    <LinearGradient 
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1, padding: 10 }}>
      
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <GradientText style={{ fontSize: 32, fontWeight: 'bold' }}>Dashboard</GradientText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => navigation.navigate(item.screen)}
            style={{ width: '46%', margin: '2%' }}
            activeOpacity={0.7}
          >
            <GlassCard style={{ height: 110, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 30, marginBottom: 5 }}>{item.icon}</Text>
              <Text style={{ color: theme.text, marginTop: 5, fontWeight: 'bold' }}>{item.name}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Ask AI Floating Action Button */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          backgroundColor: '#007AFF',
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 6
        }}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AskScreen")}
      >
        <Text style={{ fontSize: 28 }}>✨</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}