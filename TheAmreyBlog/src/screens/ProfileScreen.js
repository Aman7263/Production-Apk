import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { supabase } from "../config/supabase"
import { useTheme } from "../Theme/useTheme"
import { createStyles } from "../Theme/createStyles"

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme()
  const styles = createStyles(theme)

  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [avatar, setAvatar] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  async function getUser() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user

    if (currentUser) {
      setUser(currentUser)
      setEmail(currentUser.email || "")
      setName(currentUser.user_metadata?.name || "")
      setAvatar(currentUser.user_metadata?.avatar_url || null)
    }
  }

  /* ---------- IMAGE PICKER ---------- */

  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert("Permission required to access gallery")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri)
        setAvatar(result.assets[0].uri) // Show immediately as latest
      }
    } catch (error) {
      console.log("Gallery Error:", error)
      Alert.alert("Unable to open gallery")
    }
  }

  /* ---------- SAVE ALL CHANGES ---------- */

  async function handleSave() {
    if (!user) return

    setLoading(true)

    try {
      let avatarUrl = avatar

      // Upload image if selected
      if (selectedImage && selectedImage !== avatar) {
        const response = await fetch(selectedImage)
        const blob = await response.blob()
        const fileExt = selectedImage.split(".").pop()
        const fileName = `${user.id}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, blob, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName)

        avatarUrl = data.publicUrl
      }

      // Update name + avatar
      await supabase.auth.updateUser({
        data: {
          name,
          avatar_url: avatarUrl
        }
      })

      setAvatar(avatarUrl)
      setSelectedImage(null)

      // Update password (optional)
      if (password) {
        if (password.length < 6) {
          Alert.alert("Password must be at least 6 characters long 📌")
          setLoading(false)
          return
        }
        await supabase.auth.updateUser({
          password: password
        })
      }

      setPassword("")
      Alert.alert("Profile updated successfully 💖")
    } catch (error) {
      console.log("Update error:", error)
      Alert.alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  /* ---------- NAVIGATE TO PAYMENT HISTORY ---------- */
  function goToPaymentHistory() {
    navigation.navigate("PaymentHistory", { userId: user?.id })
  }

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.centerContainer}
    >
      <View style={styles.card}>

        <Text style={[styles.headline, { fontSize: 26, marginBottom: 20 }]}>
          My Profile ✨
        </Text>

        {/* Avatar */}
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{
              uri: avatar || "https://i.pravatar.cc/300"
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignSelf: "center",
              marginBottom: 20
            }}
          />
        </TouchableOpacity>

        {/* Email */}
        <TextInput
          value={email}
          editable={false}
          style={[styles.input, { opacity: 0.6 }]}
        />

        {/* Name */}
        <TextInput
          placeholder="Your Name 💖"
          placeholderTextColor="#999"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        {/* Password */}
        <TextInput
          placeholder="New Password (optional) 🔐"
          placeholderTextColor="#999"
          style={[styles.input, { marginTop: 15 }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: 20 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Payment History Button */}
        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 20 }]}
          onPress={goToPaymentHistory}
        >
          <Text style={styles.btnText}>Payment History</Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  )
}