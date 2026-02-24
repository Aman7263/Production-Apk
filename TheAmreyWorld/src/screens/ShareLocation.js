import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemeContext } from "../components/ThemeContext";

export default function ShareLocation() {
  const { themeStyle } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.background, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.statusBox, { backgroundColor: themeStyle.card }]}>
        <Text style={{ color: themeStyle.text, fontSize: 18 }}>📡 Location Sharing is Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBox: { padding: 30, borderRadius: 20, alignItems: 'center' }
});