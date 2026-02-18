// Screens/AuthScreen.js
import React, { useEffect } from "react";
import { View, Button, StyleSheet } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebase";

export default function AuthScreen() {
  // Set up Google auth request (Web only)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "190362323934-i46pdgn078ch9tqotksj2cr35gj5d83n.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => console.log("Signed in successfully"))
        .catch((err) => console.log("Sign in error:", err));
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Button
        title="Sign in with Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
