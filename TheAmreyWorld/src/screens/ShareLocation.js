import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from '../Theme/ThemeContext';

export default function ShareLocation() {
  const { theme  } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.statusBox, { backgroundColor: theme.card }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>📡 Location Sharing is Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBox: { padding: 30, borderRadius: 20, alignItems: 'center' }
});