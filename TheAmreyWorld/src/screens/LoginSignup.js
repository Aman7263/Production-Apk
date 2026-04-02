import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { supabase } from "../config/supabase";
import { API } from "../config/api";
import { useTheme } from "../Theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginSignup() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"

  // Generate a random 6-digit Partner ID
  const generatePartnerID = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Handle Login
  const handleLogin = async () => {
    try {
      await API.signIn(email, password);
      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle Signup
  const handleSignup = async () => {
    try {
      const data = await API.signUp(email, password);
      const userId = data?.user?.id;

      if (!userId) {
        Alert.alert("Success", "Check your email for confirmation!");
        return;
      }

      const partnerID = generatePartnerID();
      await API.createPartner(userId, partnerID);

      Alert.alert("Success", `Signed up successfully!\nYour Partner ID: ${partnerID}`);
      setMode("login");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  // Submit handler depending on mode
  const handleSubmit = () => {
    if (mode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardWrapper, { backgroundColor: theme.card }]}>
            <Text style={[styles.brand, { color: theme.text }]}>TheAmrey World</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Connect with your primary partner
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor={theme.secondaryText}
              onChangeText={setEmail}
              value={email}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={theme.secondaryText}
              secureTextEntry
              onChangeText={setPassword}
              value={password}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card },
              ]}
            />

            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.btnText, { color: theme.buttonText }]}>
                {mode === "login" ? "Login" : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secBtn}
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
            >
              <Text style={[styles.secBtnText, { color: theme.primary }]}>
                {mode === "login"
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Login"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 25 },
  cardWrapper: {
    padding: 30,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  brand: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 40 },
  input: {
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
  },
  mainBtn: {
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  btnText: { fontSize: 18, fontWeight: "bold" },
  secBtn: { marginTop: 25, alignItems: "center" },
  secBtnText: { fontSize: 15, fontWeight: "500" },
});