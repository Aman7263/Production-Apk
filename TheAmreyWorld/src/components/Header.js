import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../components/ThemeContext';

export default function Header({ partnerId }) {
  const { themeStyle, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={{
      height: 90,
      paddingTop: 40,
      paddingHorizontal: 20,
      backgroundColor: themeStyle.header,
      flexDirection: 'row',
      justifyContent: 'space-between'
    }}>
      <View>
        <Text style={{ color: themeStyle.text, fontWeight: 'bold' }}>
          TheAmrey World
        </Text>
        <Text style={{ color: themeStyle.text, fontSize: 10 }}>
          ID: {partnerId || "Standalone"}
        </Text>
      </View>

      <TouchableOpacity onPress={toggleTheme}>
        <Text style={{ fontSize: 20 }}>🎨</Text>
      </TouchableOpacity>
    </View>
  );
}