import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from "../config/supabase";

export default function ProfileScreen({ navigation }) {
  const { theme  } = useTheme();

  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerID, setPartnerID] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) return;

    setUser(currentUser);
    setEmail(currentUser.email || "");
    setName(currentUser.user_metadata?.name || "");

    // --- FIXED: fetch signed URL properly ---
    const avatarPath = currentUser.user_metadata?.avatar_url;
    if (avatarPath) {
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 60); // URL valid 60s
      if (!urlError && signedUrlData?.signedUrl) setProfilePic(signedUrlData.signedUrl);
    }

    // Fetch partner ID from partners table
    const { data: partnerData } = await supabase
      .from("partners")
      .select("partner_id")
      .eq("user_id", currentUser.id)
      .single();
    if (partnerData?.partner_id) setPartnerID(partnerData.partner_id);
  }

  useEffect(() => {
    if (!partnerID) {
      setPartnerName("");
      return;
    }

    const fetchPartnerName = async () => {
      const { data, error } = await supabase
        .from("auth.users")
        .select("user_metadata")
        .eq("id", partnerID)
        .single();
      if (data) setPartnerName(data.user_metadata?.name || "Not found");
      else setPartnerName("Not found");
    };

    fetchPartnerName();
  }, [partnerID]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setProfilePic(result.assets[0].uri);
    }
  };

  const uploadProfilePic = async (uri) => {
    if (!uri) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, blob, { upsert: true });
      if (error) throw error;
      return fileName; // save only path, not public URL
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let avatarPath = profilePic;

      if (selectedImage && selectedImage !== profilePic) {
        const uploadedPath = await uploadProfilePic(selectedImage);
        if (uploadedPath) avatarPath = uploadedPath;
      }

      await supabase.auth.updateUser({
        data: { name, avatar_url: avatarPath },
        password: password || undefined,
      });

      const { data: existingPartner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingPartner) {
        await supabase.from("partners").update({ partner_id: partnerID }).eq("user_id", user.id);
      } else {
        await supabase.from("partners").insert({ user_id: user.id, partner_id: partnerID });
      }

      setPassword("");
      setSelectedImage(null);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const goToPaymentHistory = () => {
    navigation.navigate("PaymentHistory", { userId: user?.id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 25 }}>
      <TouchableOpacity onPress={pickImage} style={styles.profilePicWrapper}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        ) : (
          <View style={[styles.profilePic, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontSize: 30 }}>👤</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={theme.text + "99"}
        />

        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          placeholderTextColor={theme.text + "99"}
          secureTextEntry
        />

        <Text style={[styles.label, { color: theme.text }]}>Partner ID</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
          value={partnerID}
          onChangeText={setPartnerID}
          placeholder="Enter Partner ID"
          placeholderTextColor={theme.text + "99"}
        />

        {partnerID !== "" && (
          <Text style={{ marginTop: 5, color: theme.text, opacity: 0.8 }}>
            Partner Name: {partnerName}
          </Text>
        )}

        <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>Email</Text>
        <Text style={{ color: theme.text, fontSize: 18 }}>{email}</Text>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSaveChanges} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={goToPaymentHistory}>
        <Text style={styles.buttonText}>Payment History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#ff4d4d", marginTop: 10 }]} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: 20, borderRadius: 15, marginBottom: 30 },
  profilePicWrapper: { alignSelf: "center", marginBottom: 20 },
  profilePic: { width: 120, height: 120, borderRadius: 60 },
  label: { fontSize: 12, opacity: 0.6, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15 },
  button: { padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#26850c", fontWeight: "bold" },
});