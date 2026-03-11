import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../config/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../Theme/useTheme'
import { createStyles } from '../Theme/createStyles'

export default function SignupScreen({ navigation }) {

  const { theme } = useTheme()
  const styles = createStyles(theme)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signup() {
    if (loading) return

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      Alert.alert("Please fill all fields 💕")
      return
    }

    if (password.length < 6) {
      Alert.alert("Password must be 6+ characters ❤️")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password
      })

      if (error) Alert.alert(error.message)
      else {
        Alert.alert("Signup successful 💖", "Check your email.")
        navigation.replace('Login')
      }

    } catch (err) {
      Alert.alert("Something went wrong ❌", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.centerContainer}
    >

      <View style={styles.card}>

        {/* Headline */}
        <Text style={[styles.headline, { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]}>
          TheAmrey
        </Text>

        <TextInput
          placeholder="Enter Email 💌"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Create Password 🔐"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={signup}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Please wait..." : "Signup 💖"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>

      </View>

    </LinearGradient>
  )
}
