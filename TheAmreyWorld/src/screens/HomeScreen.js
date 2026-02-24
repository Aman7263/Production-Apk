import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../components/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { themeStyle } = useContext(ThemeContext);

  const menu = [
    { name: "Map", screen: "MapScreen", icon: "📍" },
    { name: "Chat", screen: "Chat", icon: "💬" },
    { name: "AI Ask", screen: "AskScreen", icon: "🤖" },
    { name: "Profile", screen: "ProfileScreen", icon: "👤" }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.background, padding: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => navigation.navigate(item.screen)}
            style={{
              width: '46%',
              margin: '2%',
              height: 100,
              backgroundColor: themeStyle.card,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: themeStyle.text
            }}>
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <Text style={{ color: themeStyle.text }}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}