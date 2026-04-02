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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from "../config/supabase";
import { API } from "../config/api";

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerID, setPartnerID] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [originalMyId, setOriginalMyId] = useState("");
  const [linkedId, setLinkedId] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const currentUser = await API.getUser();
    if (!currentUser) return;

    setUser(currentUser);
    setEmail(currentUser.email || "");
    setName(currentUser.user_metadata?.name || "");

    // Fetch avatar URL if exists
    const avatarPath = currentUser.user_metadata?.avatar_url;
    if (avatarPath) {
      try {
        const signedUrl = await API.createSignedUrl(avatarPath, 60);
        if (signedUrl) setProfilePic(signedUrl);
      } catch (e) { console.error("URL Error:", e); }
    }

    // Fetch partner IDs
    const partnerData = await API.getPartnerProfile(currentUser.id);

    if (partnerData?.partner_id) {
      if (partnerData.linked_id) {
        setPartnerID(partnerData.linked_id);
        setLinkedId(partnerData.linked_id);
      } else {
        setPartnerID(partnerData.partner_id);
      }
      setOriginalMyId(partnerData.partner_id);
    }

    // Check payment status
    const paid = await API.getPaymentStatus(currentUser.id);
    setHasPaid(paid);
  }

  useEffect(() => {
    if (!partnerID) {
      setPartnerName("");
      return;
    }

    const fetchPartnerName = async () => {
      const data = await API.getPartnerByPartnerId(partnerID);

      if (data && partnerID !== originalMyId) {
        setPartnerName(partnerID === linkedId ? `✅ Linked Partner: ${partnerID}` : `User Alias: ${partnerID}`);
      } else if (partnerID === originalMyId) {
        setPartnerName("This is your own ID");
      } else {
        setPartnerName("Not found");
      }
    };

    fetchPartnerName();
  }, [partnerID, originalMyId]);

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
    if (!uri || !user) return null;
    try {
      return await API.uploadAvatar(uri, user.id);
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

      await API.updateAuth({
        data: { name, avatar_url: avatarPath },
        password: password || undefined,
      });

      Alert.alert("Success", "Profile details updated successfully!");
      setPassword("");
      setSelectedImage(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const sendPairingRequest = async () => {
    if (!name) {
      Alert.alert("Name Required", "Please enter your name in the profile before linking a partner.");
      return;
    }
    if (partnerID === originalMyId || partnerID === "") {
      Alert.alert("Error", "Enter a valid Partner ID that is not your own.");
      return;
    }
    setLoading(true);
    try {
      const targetPartner = await API.getPartnerByPartnerId(partnerID);

      if (targetPartner) {
        await API.sendNotification({
          sender_id: user.id,
          receiver_id: targetPartner.user_id,
          message: `${name} (${originalMyId}) requested to pair with you!`,
          type: "partner_request",
          action: "connect",
          status: "pending"
        });
        Alert.alert("Request Sent", "A pairing request has been sent via notification. Wait for their approval!");
      } else {
        Alert.alert("Error", "No user found with that Partner ID.");
        setPartnerID(originalMyId);
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const goToPaymentHistory = () => {
    navigation.navigate("PaymentHistory", { userId: user?.id });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        style={{ flex: 1, backgroundColor: theme.background }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 25 }}>
          <TouchableOpacity onPress={pickImage} style={styles.profilePicWrapper}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, { backgroundColor: theme.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.primary }]}>
                <Text style={{ fontSize: 30 }}>👤</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.background + "40" }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.secondaryText}
            />

            <Text style={[styles.label, { color: theme.secondaryText }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.background + "40" }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.secondaryText}
              secureTextEntry
            />

            <Text style={[styles.label, { color: theme.secondaryText }]}>
              {linkedId ? "Connected Partner" : "Partner ID (Requires Completed Payment)"}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: linkedId ? "#4CAF50" : theme.primary,
                  opacity: (hasPaid || linkedId) ? 1 : 0.5,
                  backgroundColor: theme.background + "40"
                }
              ]}
              value={partnerID}
              onChangeText={setPartnerID}
              placeholder="Enter Partner ID"
              placeholderTextColor={theme.secondaryText}
              editable={hasPaid && !linkedId}
            />

            {partnerID !== "" && (
              <Text style={{ marginTop: 5, color: theme.text, fontWeight: "500" }}>
                Partner: {partnerName} {partnerID !== "" && `(${partnerID})`}
              </Text>
            )}

            {hasPaid && partnerID !== "" && partnerID !== originalMyId && partnerName.startsWith("User") && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.glow, marginTop: 15, paddingVertical: 10 }]}
                onPress={sendPairingRequest}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.buttonText, { color: theme.buttonText }]}>Send Pairing Request</Text>}
              </TouchableOpacity>
            )}

            <Text style={[styles.label, { color: theme.secondaryText, marginTop: 15 }]}>Email</Text>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "600" }}>{email}</Text>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSaveChanges} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.buttonText} /> : <Text style={[styles.buttonText, { color: theme.buttonText }]}>Save Changes</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={goToPaymentHistory}>
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Payment Center</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: "#ef4444", marginTop: 20 }]} onPress={() => API.signOut()}>
            <Text style={[styles.buttonText, { color: "#fff" }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: 20, borderRadius: 15, marginBottom: 30 },
  profilePicWrapper: { alignSelf: "center", marginBottom: 20 },
  profilePic: { width: 120, height: 120, borderRadius: 60 },
  label: { fontSize: 12, opacity: 0.6, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15 },
  button: { padding: 15, borderRadius: 12, alignItems: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  buttonText: { fontWeight: "bold", fontSize: 16 },
});