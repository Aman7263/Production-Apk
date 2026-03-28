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
      .select("partner_id, linked_id")
      .eq("user_id", currentUser.id)
      .single();

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
    const { data: paymentData } = await supabase
      .from("payments")
      .select("status")
      .eq("user_id", currentUser.id)
      .eq("status", "completed");

    if (paymentData && paymentData.length > 0) {
      setHasPaid(true);
    }
  }

  useEffect(() => {
    if (!partnerID) {
      setPartnerName("");
      return;
    }

    const fetchPartnerName = async () => {
      // Clients cannot query auth.users securely. We check the partners table instead!
      const { data, error } = await supabase
        .from("partners")
        .select("user_id")
        .eq("partner_id", partnerID)
        .single();

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
    if (partnerID === originalMyId || partnerID === "") {
      Alert.alert("Error", "Enter a valid Partner ID that is not your own.");
      return;
    }
    setLoading(true);
    try {
      const { data: targetPartner } = await supabase
        .from("partners")
        .select("user_id")
        .eq("partner_id", partnerID)
        .single();

      if (targetPartner) {
        await supabase.from("notifications").insert([{
          sender_id: user.id,
          receiver_id: targetPartner.user_id,
          message: `${name + ' ' + originalMyId} requested to pair with you!`,
          type: "partner_request",
          action: "connect",
          status: "pending"
        }]);
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
              {linkedId ? "Connected Partner ID" : "Partner ID (Requires Completed Payment)"}
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
                Partner Name: {partnerName}
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

          <TouchableOpacity style={[styles.button, { backgroundColor: "#ef4444", marginTop: 20 }]} onPress={() => supabase.auth.signOut()}>
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