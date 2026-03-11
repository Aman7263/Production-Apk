import React, { useContext } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from '../Theme/ThemeContext';

export default function LocationMap() {
  const { theme  } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>User Marked Locations</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.text }}>You Tagged: New Delhi, India</Text>
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