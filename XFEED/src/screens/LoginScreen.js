import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../config/supabase'
import { signInWithGoogle } from '../config/googleAuth'
import { useTheme } from '../Theme/useTheme'
import { createStyles } from '../Theme/createStyles'

export default function LoginScreen({ navigation }) {

  const { theme } = useTheme()
  const styles = createStyles(theme)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // ✅ Listen for auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigation.replace("Dashboard") // <-- Your Dashboard route
        }
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  // ✅ EMAIL LOGIN
  async function login() {
    if (!email || !password) {
      Alert.alert("Please enter email and password 💕")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ GOOGLE LOGIN
  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true)
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.centerContainer}
    >
      <View style={styles.card}>

        <Text
          style={[
            styles.headline,
            { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 }
          ]}
        >
          XFEED_TheAmrey ✨
        </Text>

        <TextInput
          placeholder="Enter your email 💌"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Enter password 🔐"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={login}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Please wait..." : "Login 💖"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 10 }]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.btnText}>
            Don't have account? Signup 💕
          </Text>
        </TouchableOpacity>

        <View style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 20
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
          <Text style={{ marginHorizontal: 10, color: "#777" }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }
          ]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={[styles.btnText, { marginLeft: 8 }]}>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  )
}