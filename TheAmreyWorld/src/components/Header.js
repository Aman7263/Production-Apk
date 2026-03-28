import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../Theme/ThemeContext';
import GradientText from './GradientText';
import { supabase } from '../config/supabase';

export default function Header({ partnerId }) {
  const { theme , toggleTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');
        
        const { data: partnerData } = await supabase
          .from("partners")
          .select("partner_id")
          .eq("user_id", user.id)
          .single();
        if (partnerData) {
          setMyId(partnerData.partner_id);
        }
      }
    };
    fetchUserData();
  }, []);

  return (
    <BlurView intensity={80} tint="dark" style={{
      height: 90,
      paddingTop: 40,
      paddingHorizontal: 20,
      backgroundColor: theme.header,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: theme.glow,
      zIndex: 100
    }}>
      <View>
        <GradientText style={{ fontSize: 20, fontWeight: 'bold' }}>
          Welcome {userName}
        </GradientText>
        <Text style={{ color: theme.text, fontSize: 10, opacity: 0.8 }}>
          ID - {myId || partnerId || "Loading..."}
        </Text>
      </View>

      <TouchableOpacity onPress={toggleTheme}>
        <Text style={{ fontSize: 20 }}>🌌</Text>
      </TouchableOpacity>
    </BlurView>
  );
}