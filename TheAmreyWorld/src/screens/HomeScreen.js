import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from '../config/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GradientText from '../components/GradientText';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [isPaired, setIsPaired] = useState(false);

  useEffect(() => {
    const checkPairing = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myData } = await supabase
        .from("partners")
        .select("partner_id, linked_id")
        .eq("user_id", user.id)
        .single();

      if (myData?.linked_id) {
        setIsPaired(true);
      } else {
        setIsPaired(false);
      }
    };

    // Check pairing every time we focus the screen
    const unsubscribe = navigation.addListener('focus', () => {
      checkPairing();
    });

    checkPairing();
    return unsubscribe;
  }, [navigation]);

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
        {menu.map((item, i) => {
          const isLocked = !isPaired && ["MapScreen", "Chat", "LocationMap"].includes(item.screen);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (isLocked) {
                  Alert.alert("Locked", "You must pair with a partner via Profile requests to access this feature.");
                } else {
                  navigation.navigate(item.screen);
                }
              }}
              style={{ width: '46%', margin: '2%' }}
              activeOpacity={0.7}
            >
              <GlassCard style={{ height: 110, justifyContent: 'center', alignItems: 'center', opacity: isLocked ? 0.4 : 1 }}>
                <Text style={{ fontSize: 30, marginBottom: 5 }}>{isLocked ? "🔒" : item.icon}</Text>
                <Text style={{ color: theme.text, marginTop: 5, fontWeight: 'bold' }}>{item.name}</Text>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
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
        onPress={() => {
          if (!isPaired) {
            Alert.alert("Locked", "Pairing required to chat with AI.");
          } else {
            navigation.navigate("AskScreen");
          }
        }}
      >
        <Text style={{ fontSize: 28 }}>{"✨"}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}