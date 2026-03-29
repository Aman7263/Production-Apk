import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../Theme/ThemeContext';
import GradientText from './GradientText';
import { supabase } from '../config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ partnerId, title, rightAction }) {
  const { theme, toggleTheme, currentTheme } = useTheme();
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
    <BlurView intensity={80} tint={currentTheme === "dark" ? "dark" : "light"} style={{
      height: Platform.OS === 'ios' ? 100 : 80,
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
      paddingHorizontal: 20,
      backgroundColor: theme.header,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.glow,
      zIndex: 100
    }}>
      <View style={{ flex: 1 }}>
        <GradientText style={{ fontSize: 20, fontWeight: 'bold' }}>
          {title || `Welcome ${userName}`}
        </GradientText>
        {!title && (
          <Text style={{ color: theme.text, fontSize: 10, opacity: 0.8 }}>
            ID - {myId || partnerId || "Loading..."}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {rightAction}
        
        <TouchableOpacity 
          onPress={toggleTheme} 
          style={{ 
            padding: 8, 
            borderRadius: 20, 
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.glow
          }}
        >
          <Ionicons 
            name={currentTheme === 'dark' ? 'sunny' : 'moon'} 
            size={20} 
            color={theme.primary} 
          />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}