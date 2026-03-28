import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { supabase } from "../config/supabase";

export default function LoginSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"

  // Generate a random 6-digit Partner ID
  const generatePartnerID = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Handle Login
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Success", "Logged in successfully!");
    // You can navigate to your app main page here
  };

  // Handle Signup
  const handleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      const userId = data?.user?.id;

      if (!userId) {
        Alert.alert("Success", "Check your email for confirmation!");
        return;
      }

      const partnerID = generatePartnerID();

     // ✅ Insert into partners table in custom schema
      const { error: partnerError } = await supabase
        .from("partners")
        .insert([{ user_id: userId, partner_id: partnerID }]);

      if (partnerError) {
        console.error("Failed to insert partner:", partnerError);
        Alert.alert("Error", "Failed to create Partner ID.");
        return;
      }

      Alert.alert(
        "Success",
        `Signed up successfully!\nYour Partner ID: ${partnerID}`
      );
      setMode("login"); // Switch to login after signup
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
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
    <View style={styles.container}>
      <Text style={styles.brand}>TheAmrey World</Text>

      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={styles.input}
      />

      <TouchableOpacity style={styles.mainBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>
          {mode === "login" ? "Login" : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secBtn}
        onPress={() => setMode(mode === "login" ? "signup" : "login")}
      >
        <Text style={styles.secBtnText}>
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "#fff" },
  brand: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 40 },
  input: { borderWidth: 1, borderColor: "#ddd", marginBottom: 15, padding: 15, borderRadius: 10 },
  mainBtn: { backgroundColor: "#007AFF", padding: 15, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  secBtn: { marginTop: 15, alignItems: "center" },
  secBtnText: { color: "#007AFF" },
});