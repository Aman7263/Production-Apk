import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../Theme/ThemeContext';
import GradientText from './GradientText';

export default function Header({ partnerId }) {
  const { theme , toggleTheme } = useTheme();

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
          TheAmrey World
        </GradientText>
        <Text style={{ color: theme.text, fontSize: 10, opacity: 0.8 }}>
          ID: {partnerId || "Standalone"}
        </Text>
      </View>

      <TouchableOpacity onPress={toggleTheme}>
        <Text style={{ fontSize: 20 }}>🌌</Text>
      </TouchableOpacity>
    </BlurView>
  );
}