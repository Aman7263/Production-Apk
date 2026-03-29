import React, { useContext, useEffect, useState, useRef, useLayoutEffect } from "react";
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
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../config/supabase";
import { useTheme } from '../Theme/ThemeContext';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MapScreen({ navigation }) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markerModalVisible, setMarkerModalVisible] = useState(false);
  const [listViewVisible, setListViewVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setListViewVisible(true)}
          style={{ paddingHorizontal: 15 }}
        >
          <Icon name="format-list-bulleted" size={26} color={theme.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const [formData, setFormData] = useState({
    tag_name: "",
    description: "",
    category: "",
    partner_name: "",
    expected_visit: new Date(),
    completed_date: null,
  });
  const [showExpectedPicker, setShowExpectedPicker] = useState(false);
  const [showCompletedPicker, setShowCompletedPicker] = useState(false);

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

      // Fetch locations tagged by user AND partner securely using .in()
      if (partnerId) {
        const ids = linkedId ? [partnerId, linkedId] : [partnerId];
        const { data: markerData, error: mError } = await supabase
          .from("locations")
          .select("*")
          .in("partner_tagged_id", ids);

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

  const focusMarker = (marker) => {
    setListViewVisible(false);
    mapRef.current?.animateToRegion({
      ...marker.coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const getMarkerColor = (id) => {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    return colors[id % colors.length];
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

  const handleRequestCompletion = async () => {
    if (!selectedMarker || !currentPartner.linked_id) {
      Alert.alert("Link Required", "You must be paired with a partner to request completion approval.");
      return;
    }

    try {
      const { data: linkedPartner } = await supabase
        .from("partners")
        .select("user_id")
        .eq("partner_id", currentPartner.linked_id)
        .single();

      if (!linkedPartner) throw new Error("Linked partner not found.");

      const expDate = selectedMarker.data.expected_visit ? new Date(selectedMarker.data.expected_visit).toLocaleDateString() : 'N/A';

      const payload = {
        sender_id: currentPartner.id,
        receiver_id: linkedPartner.user_id,
        message: `${selectedMarker.data.tag_name} (on ${expDate})`,
        type: 'completion_request',
        action: 'approve_completion',
        target_id: selectedMarker.id,
        status: 'pending'
      };

      const { error } = await supabase.from('notifications').insert(payload);
      if (error) throw error;

      setMarkerModalVisible(false);
      Alert.alert("Success", "Completion request sent to your partner.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
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
        ref={mapRef}
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
              {/* Label ABOVE */}
              <View style={[styles.label, { borderColor: getMarkerColor(m.id), backgroundColor: theme.background }]}>
                <Text style={[styles.labelText, { color: theme.text }]} numberOfLines={1}>
                  {m.data.tag_name}
                </Text>
              </View>

              {/* Icon BELOW */}
              <Icon
                name={m.data.completed_date ? "map-check" : "map-marker"}
                size={42}
                color={getMarkerColor(m.id)}
              />
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
              <Text style={{ color: theme.text, marginBottom: 5 }}>Tagged By</Text>
              <TextInput
                placeholder="Partner Name"
                placeholderTextColor="#888"
                value={formData.partner_name}
                style={[styles.input, { color: theme.text, borderColor: theme.footer, opacity: 0.7 }]}
                editable={false}
              />

              <Text style={{ color: theme.text, marginBottom: 5 }}>Expected Visit Date</Text>
              <TouchableOpacity
                onPress={() => setShowExpectedPicker(true)}
                style={[styles.input, { color: theme.text, borderColor: theme.footer, justifyContent: 'center' }]}
              >
                <Text style={{ color: theme.text }}>
                  {formData.expected_visit.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showExpectedPicker && (
                <DateTimePicker
                  value={formData.expected_visit}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowExpectedPicker(false);
                    if (event.type === 'set' && date) {
                      setFormData({ ...formData, expected_visit: date });
                    }
                  }}
                />
              )}

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Icon
                name={selectedMarker?.data.completed_date ? "map-check" : "map-marker"}
                size={34}
                color={selectedMarker ? getMarkerColor(selectedMarker.id) : theme.primary}
                style={{ marginRight: 15 }}
              />
              <View>
                <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>
                  {selectedMarker?.data.tag_name}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>ID: {selectedMarker?.id}</Text>
              </View>
            </View>
            <Text style={{ color: theme.text, marginBottom: 5, fontSize: 14 }}>
              📌 {selectedMarker?.data.description || "No description provided"}
            </Text>

            <View style={{ marginVertical: 10 }}>
              <Text style={{ color: theme.text, opacity: 0.7, fontSize: 13 }}>
                👤 Tagged By: {selectedMarker?.data.partner_name || "Unknown"}
              </Text>
              <Text style={{ color: theme.text, opacity: 0.7, fontSize: 13 }}>
                📅 Expected: {selectedMarker?.data.expected_visit ? new Date(selectedMarker.data.expected_visit).toLocaleDateString() : "No date"}
              </Text>
              {selectedMarker?.data.completed_date && (
                <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 13 }}>
                  ✅ Completed: {new Date(selectedMarker.data.completed_date).toLocaleDateString()}
                </Text>
              )}
            </View>

            {/* Mark as Completed Request Flow */}
            {!selectedMarker?.data.completed_date && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#4CAF50', marginBottom: 10 }]}
                onPress={handleRequestCompletion}
              >
                <Text style={styles.btnText}>Request Completion Approval</Text>
              </TouchableOpacity>
            )}

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

      {/* Tagged Locations List Modal */}
      <Modal visible={listViewVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, height: '70%', minHeight: '70%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={[styles.title, { color: theme.text }]}>Tagged Locations</Text>
              <TouchableOpacity onPress={() => setListViewVisible(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={markers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => focusMarker(item)}
                  style={{
                    padding: 15,
                    backgroundColor: theme.card,
                    borderRadius: 12,
                    marginBottom: 10,
                    borderLeftWidth: 5,
                    borderLeftColor: getMarkerColor(item.id),
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <Icon
                    name={item.data.completed_date ? "map-check" : "map-marker"}
                    size={28}
                    color={getMarkerColor(item.id)}
                    style={{ marginRight: 15 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{item.data.tag_name}</Text>
                      {item.data.completed_date && <Icon name="check-decagram" size={16} color="#4CAF50" />}
                    </View>
                    <Text style={{ color: theme.text, opacity: 0.6, fontSize: 13, marginBottom: 5 }}>{item.data.description || "No description"}</Text>

                    <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 10 }}>
                      <View style={{ backgroundColor: theme.background + '80', padding: 5, borderRadius: 5 }}>
                        <Text style={{ color: theme.text, fontSize: 10 }}>📅 Exp: {new Date(item.data.expected_visit).toLocaleDateString()}</Text>
                      </View>
                      {item.data.completed_date && (
                        <View style={{ backgroundColor: '#E8F5E9', padding: 5, borderRadius: 5 }}>
                          <Text style={{ color: '#2E7D32', fontSize: 10, fontWeight: 'bold' }}>✅ Done: {new Date(item.data.completed_date).toLocaleDateString()}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ color: theme.primary, fontSize: 10 }}>By: {item.data.partner_name}</Text>
                      <Text style={{ color: item.data.completed_date ? '#4CAF50' : '#FF9800', fontSize: 10, fontWeight: 'bold' }}>
                        {item.data.completed_date ? 'COMPLETED' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: theme.text, textAlign: 'center', marginTop: 20 }}>No locations tagged yet.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
  },

  label: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 2,   // 👈 pushes it above icon
    maxWidth: 110,
  },

  labelText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center"
  },
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