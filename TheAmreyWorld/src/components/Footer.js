import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { ThemeContext } from '../components/ThemeContext';

export default function Footer() {
  const { themeStyle } = useContext(ThemeContext);

  return (
    <View style={{
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeStyle.footer
    }}>
      <Text style={{
        color: themeStyle.text,
        fontWeight: 'bold',
        fontSize: 14
      }}>
        My love for Amrey 💙
      </Text>
    </View>
  );
}