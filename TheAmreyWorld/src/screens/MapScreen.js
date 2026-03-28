import React, { useContext, useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../config/supabase";
import { useTheme } from '../Theme/ThemeContext';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MapScreen() {
  const { theme  } = useTheme();
  const [markers, setMarkers] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markerModalVisible, setMarkerModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    tag_name: "",
    description: "",
    category: "",
    partner_name: "",
    expected_visit: new Date(),
    completed_date: null,
  });

  useEffect(() => {
    fetchPartnerAndMarkers();
  }, []);

  const fetchPartnerAndMarkers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please login to view map");
        return;
      }

      // Get user name and partner ID
      const name = user.user_metadata?.name || user.email?.split('@')[0] || "User";
      
      const { data: partnerData, error: pError } = await supabase
        .from("partners")
        .select("partner_id, linked_id")
        .eq("user_id", user.id)
        .single();
        
      const partnerId = partnerData ? partnerData.partner_id : null;
      const linkedId = partnerData ? partnerData.linked_id : null;

      if (!partnerId) throw new Error("Partner profile not found");
      setCurrentPartner({ id: user.id, name, partner_id: partnerId, linked_id: linkedId });
      setFormData(prev => ({ ...prev, partner_name: name }));

      // Fetch locations tagged by user AND partner securely
      if (partnerId) {
        const { data: markerData, error: mError } = await supabase
          .from("locations")
          .select("*")
          .or(`partner_tagged_id.eq.${partnerId}${linkedId ? `,partner_tagged_id.eq.${linkedId}` : ''}`);

      if (mError) throw mError;
      
      if (markerData) {
        setMarkers(markerData.map(d => ({
          id: d.id,
          coordinate: { latitude: d.latitude, longitude: d.longitude },
          data: d,
        })));
      }
      } // closing brace for if (partnerId)
    } catch (error) {
      console.error("Setup Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setTempMarker({ coordinate: coords });
    setFormData(prev => ({
      ...prev,
      tag_name: "",
      description: "",
      category: "",
      expected_visit: new Date(),
      completed_date: null,
    }));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.tag_name) return Alert.alert("Required", "Tag name is mandatory");

    try {
      const payload = {
        tag_name: formData.tag_name,
        description: formData.description,
        category: formData.category,
        partner_name: formData.partner_name,
        expected_visit: formData.expected_visit,
        completed_date: formData.completed_date,
        latitude: tempMarker.coordinate.latitude,
        longitude: tempMarker.coordinate.longitude,
        partner_tagged_id: currentPartner.partner_id,
        user_id: currentPartner.id,
      };

      const { data, error } = await supabase
        .from("locations")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setMarkers([...markers, { id: data.id, coordinate: tempMarker.coordinate, data }]);
      setTempMarker(null);
      setModalVisible(false);
      Alert.alert("Success", "Location tagged successfully!");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleCancel = () => {
    setTempMarker(null);
    setModalVisible(false);
  };

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setMarkerModalVisible(true);
  };

  const handleDeleteMarker = async () => {
    if (!selectedMarker) return;

    // If marker belongs to current user, delete immediately
    if (selectedMarker.data.user_id === currentPartner.id) {
      try {
        const { error } = await supabase.from('locations').delete().eq('id', selectedMarker.id);
        if (error) throw error;
        setMarkers(markers.filter(m => m.id !== selectedMarker.id));
        setMarkerModalVisible(false);
        Alert.alert("Success", "Location deleted.");
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    } else {
      // Must request permission
      try {
        const payload = {
          sender_id: currentPartner.id,
          receiver_id: selectedMarker.data.user_id, // Partner's ID
          message: `${currentPartner.name || 'Your partner'} wants to delete marker "${selectedMarker.data.tag_name}"`,
          type: 'permission',
          action: 'delete_location',
          target_id: selectedMarker.id,
          status: 'pending'
        };
        const { error } = await supabase.from('notifications').insert(payload);
        if (error) throw error;
        setMarkerModalVisible(false);
        Alert.alert("Notice", "Deletion request sent to your partner.");
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={handleMapPress}
      >
        {markers.map(m => (
          <Marker 
            key={m.id} 
            coordinate={m.coordinate} 
            anchor={{ x: 0.5, y: 1 }}
            onPress={(e) => {
              e.stopPropagation();
              handleMarkerPress(m);
            }}
          >
            <View style={styles.markerWrapper}>
              <Icon name="map-marker" size={40} color={m.data.user_id === currentPartner?.id ? "#007AFF" : "#FF2D55"} />
              <View style={styles.label}><Text style={styles.labelText}>{m.data.tag_name}</Text></View>
            </View>
          </Marker>
        ))}
        {tempMarker && (
          <Marker coordinate={tempMarker.coordinate} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerWrapper}>
              <Icon name="map-marker-plus" size={45} color="#FF9500" />
              <View style={[styles.label, { borderColor: '#FF9500' }]}><Text style={styles.labelText}>New Tag</Text></View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Modal Bottom Sheet */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.title, { color: theme.text }]}>
                Tagging as: {currentPartner?.name}
              </Text>

              <TextInput
                placeholder="Tag Name"
                placeholderTextColor="#888"
                value={formData.tag_name}
                onChangeText={(t) => setFormData({ ...formData, tag_name: t })}
                style={[styles.input, { color: theme.text, borderColor: theme.footer }]}
              />
              <TextInput
                placeholder="Description"
                placeholderTextColor="#888"
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
                style={[styles.input, { color: theme.text, borderColor: theme.footer }]}
              />
              <TextInput
                placeholder="Category"
                placeholderTextColor="#888"
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })}
                style={[styles.input, { color: theme.text, borderColor: theme.footer }]}
              />
              <TextInput
                placeholder="Partner Name"
                placeholderTextColor="#888"
                value={formData.partner_name}
                onChangeText={(t) => setFormData({ ...formData, partner_name: t })}
                style={[styles.input, { color: theme.text, borderColor: theme.footer }]}
              />

              <Text style={{ color: theme.text, marginBottom: 5 }}>Expected Visit Date</Text>
              <DateTimePicker
                value={formData.expected_visit}
                mode="date"
                display="default"
                onChange={(event, date) => date && setFormData({ ...formData, expected_visit: date })}
              />

              <Text style={{ color: theme.text, marginBottom: 5 }}>Completed Date</Text>
              <DateTimePicker
                value={formData.completed_date || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => setFormData({ ...formData, completed_date: date })}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.btnText}>Save Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#aaa", marginTop: 10 }]}
                onPress={handleCancel}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Existing Marker Modal */}
      <Modal visible={markerModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {selectedMarker?.data.tag_name}
            </Text>
            <Text style={{ color: theme.text, marginBottom: 10 }}>{selectedMarker?.data.description}</Text>
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#F44336' }]} onPress={handleDeleteMarker}>
              <Text style={styles.btnText}>
                {selectedMarker?.data.user_id === currentPartner?.id ? "Delete Location" : "Request Delete Permission"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: "#aaa", marginTop: 10 }]} 
              onPress={() => setMarkerModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerWrapper: { alignItems: "center", width: 120 },
  label: {
    backgroundColor: "white",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginTop: -5,
  },
  labelText: { fontSize: 10, fontWeight: "bold", color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 400,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});