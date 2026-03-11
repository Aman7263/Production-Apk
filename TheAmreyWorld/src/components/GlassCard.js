import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../Theme/ThemeContext';

export default function GlassCard({ children, style, intensity = 40, tint = "dark" }) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container, 
      { 
        borderColor: theme.glow, 
        backgroundColor: theme.card 
      },
      style
    ]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      {/* Content wrapper to ensure children sit above the blur */}
      <View style={{ zIndex: 1, padding: 15, flex: 1, justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden', // Ensure blur doesn't bleed outside rounded corners
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  }
});
