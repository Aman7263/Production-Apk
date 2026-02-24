import React, { useContext } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { ThemeContext } from "../components/ThemeContext";

export default function LocationMap() {
  const { themeStyle } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeStyle.text }]}>User Marked Locations</Text>
        <View style={[styles.card, { backgroundColor: themeStyle.card }]}>
          <Text style={{ color: themeStyle.text }}>You Tagged: New Delhi, India</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  card: { padding: 15, borderRadius: 10, marginBottom: 10 }
});