import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../Theme/ThemeContext';
import GradientText from './GradientText';

export default function Footer() {
  const { theme  } = useTheme();

  return (
    <BlurView intensity={80} tint="dark" style={{
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.footer,
      borderTopWidth: 1,
      borderTopColor: theme.glow,
      elevation: 10
    }}>
      <GradientText style={{
        fontWeight: 'bold',
        fontSize: 14,
      }}>
        My love for Amrey 💙
      </GradientText>
    </BlurView>
  );
}