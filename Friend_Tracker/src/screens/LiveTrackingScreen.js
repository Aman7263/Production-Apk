import React, { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { supabase } from "../config/supabase"

const { width, height } = Dimensions.get("window")

export default function LiveTrackingScreen({ navigation }) {
  // User state
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Location state
  const [myLocation, setMyLocation] = useState(null)
  const [friendLocation, setFriendLocation] = useState(null)
  const [locationSubscription, setLocationSubscription] = useState(null)

  // Friends state
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)

  // Session state
  const [activeSession, setActiveSession] = useState(null)
  const [pendingSessions, setPendingSessions] = useState([])
  const [showSessionModal, setShowSessionModal] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showChatModal, setShowChatModal] = useState(false)

  // History state
  const [sharingHistory, setSharingHistory] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0)
  const timerRef = useRef(null)
  const mapRef = useRef(null)

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeScreen()
    return () => cleanup()
  }, [])

  async function initializeScreen() {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert("Error", "Please login first")
        navigation.replace("Login")
        return
      }
      setCurrentUser(user)

      // Ensure user profile exists
      await ensureUserProfile(user)

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required")
        return
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({})
      setMyLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      // Load data
      await Promise.all([
        loadFriends(user.id),
        loadFriendRequests(user.id),
        loadActiveSession(user.id),
        loadPendingSessions(user.id),
        loadSharingHistory(user.id),
      ])

      // Subscribe to realtime updates
      subscribeToRealtimeUpdates(user.id)

    } catch (error) {
      console.error("Initialization error:", error)
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  async function ensureUserProfile(user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email,
        username: user.email.split("@")[0],
        display_name: user.email.split("@")[0],
      })
    }
  }

  function cleanup() {
    if (locationSubscription) {
      locationSubscription.remove()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================

  function subscribeToRealtimeUpdates(userId) {
    // Subscribe to friend requests
    supabase
      .channel("friend_requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => loadFriendRequests(userId)
      )
      .subscribe()

    // Subscribe to session updates
    supabase
      .channel("location_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "location_sessions",
        },
        (payload) => {
          if (
            payload.new.initiator_id === userId ||
            payload.new.participant_id === userId
          ) {
            loadActiveSession(userId)
            loadPendingSessions(userId)
          }
        }
      )
      .subscribe()
  }

  function subscribeToSessionUpdates(sessionId, friendId) {
    // Subscribe to friend's location updates
    supabase
      .channel(`session_locations_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_locations",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.user_id === friendId) {
            setFriendLocation({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
            })
          }
        }
      )
      .subscribe()

    // Subscribe to chat messages
    supabase
      .channel(`session_chats_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_chats",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()
  }

  // ==================== DATA LOADING ====================

  async function loadFriends(userId) {
    const { data, error } = await supabase
      .from("friends")
      .select(`
        id,
        friend_id,
        created_at,
        friend:user_profiles!friends_friend_id_fkey (
          id, email, username, display_name, avatar_url
        )
      `)
      .eq("user_id", userId)

    if (!error && data) {
      setFriends(data)
    }
  }

  async function loadFriendRequests(userId) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        id,
        sender_id,
        status,
        created_at,
        sender:user_profiles!friend_requests_sender_id_fkey (
          id, email, username, display_name, avatar_url
        )
      `)
      .eq("receiver_id", userId)
      .eq("status", "pending")

    if (!error && data) {
      setFriendRequests(data)
    }
  }

  async function loadActiveSession(userId) {
    const { data, error } = await supabase
      .from("location_sessions")
      .select(`
        *,
        initiator:user_profiles!location_sessions_initiator_id_fkey (
          id, email, username, display_name
        ),
        participant:user_profiles!location_sessions_participant_id_fkey (
          id, email, username, display_name
        )
      `)
      .or(`initiator_id.eq.${userId},participant_id.eq.${userId}`)
      .eq("status", "active")
      .single()

    if (!error && data) {
      setActiveSession(data)
      const friendId = data.initiator_id === userId 
        ? data.participant_id 
        : data.initiator_id
      
      // Load existing chat messages
      loadChatMessages(data.id)
      
      // Subscribe to updates
      subscribeToSessionUpdates(data.id, friendId)
      
      // Start location tracking
      startLocationTracking(data.id)
      
      // Start session timer
      startSessionTimer(data.started_at)
      
      // Load friend's last known location
      loadFriendLastLocation(data.id, friendId)
    } else {
      setActiveSession(null)
    }
  }

  async function loadPendingSessions(userId) {
    const { data, error } = await supabase
      .from("location_sessions")
      .select(`
        *,
        initiator:user_profiles!location_sessions_initiator_id_fkey (
          id, email, username, display_name
        )
      `)
      .eq("participant_id", userId)
      .eq("status", "pending")

    if (!error && data) {
      setPendingSessions(data)
    }
  }

  async function loadChatMessages(sessionId) {
    const { data, error } = await supabase
      .from("session_chats")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setChatMessages(data)
    }
  }

  async function loadFriendLastLocation(sessionId, friendId) {
    const { data } = await supabase
      .from("session_locations")
      .select("latitude, longitude")
      .eq("session_id", sessionId)
      .eq("user_id", friendId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setFriendLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      })
    }
  }

  async function loadSharingHistory(userId) {
    const { data, error } = await supabase
      .from("location_sessions")
      .select(`
        *,
        initiator:user_profiles!location_sessions_initiator_id_fkey (
          id, email, username, display_name
        ),
        participant:user_profiles!location_sessions_participant_id_fkey (
          id, email, username, display_name
        )
      `)
      .or(`initiator_id.eq.${userId},participant_id.eq.${userId}`)
      .eq("status", "ended")
      .order("ended_at", { ascending: false })
      .limit(20)

    if (!error && data) {
      // Load chat counts for each session
      const historyWithCounts = await Promise.all(
        data.map(async (session) => {
          const { count } = await supabase
            .from("session_chats")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.id)
          
          return { ...session, messageCount: count || 0 }
        })
      )
      setSharingHistory(historyWithCounts)
    }
  }

  // ==================== FRIEND FUNCTIONS ====================

  async function searchUsers(query) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq("id", currentUser.id)
      .limit(10)

    if (!error && data) {
      // Filter out existing friends
      const friendIds = friends.map((f) => f.friend_id)
      const filtered = data.filter((user) => !friendIds.includes(user.id))
      setSearchResults(filtered)
    }
  }

  async function sendFriendRequest(receiverId) {
    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("sender_id", currentUser.id)
        .eq("receiver_id", receiverId)
        .single()

      if (existing) {
        Alert.alert("Info", "Friend request already sent")
        return
      }

      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUser.id,
        receiver_id: receiverId,
      })

      if (error) throw error

      Alert.alert("Success", "Friend request sent!")
      setSearchQuery("")
      setSearchResults([])
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  async function handleFriendRequest(requestId, senderId, accept) {
    try {
      if (accept) {
        // Update request status
        await supabase
          .from("friend_requests")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", requestId)

        // Add both directions of friendship
        await supabase.from("friends").insert([
          { user_id: currentUser.id, friend_id: senderId },
          { user_id: senderId, friend_id: currentUser.id },
        ])

        Alert.alert("Success", "Friend request accepted!")
      } else {
        await supabase
          .from("friend_requests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", requestId)

        Alert.alert("Info", "Friend request rejected")
      }

      loadFriendRequests(currentUser.id)
      loadFriends(currentUser.id)
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  async function removeFriend(friendId) {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase
                .from("friends")
                .delete()
                .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`)

              loadFriends(currentUser.id)
              Alert.alert("Success", "Friend removed")
            } catch (error) {
              Alert.alert("Error", error.message)
            }
          },
        },
      ]
    )
  }

  // ==================== SESSION FUNCTIONS ====================

  async function startLocationSharing(friendId) {
    try {
      // Check if session already exists
      const { data: existing } = await supabase
        .from("location_sessions")
        .select("*")
        .or(`and(initiator_id.eq.${currentUser.id},participant_id.eq.${friendId}),and(initiator_id.eq.${friendId},participant_id.eq.${currentUser.id})`)
        .in("status", ["pending", "active"])
        .single()

      if (existing) {
        Alert.alert("Info", "Session already exists with this friend")
        return
      }

      const { error } = await supabase.from("location_sessions").insert({
        initiator_id: currentUser.id,
        participant_id: friendId,
        status: "pending",
      })

      if (error) throw error

      Alert.alert("Success", "Location sharing request sent!")
      setShowFriendsModal(false)
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  async function handleSessionRequest(sessionId, accept) {
    try {
      if (accept) {
        await supabase
          .from("location_sessions")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          })
          .eq("id", sessionId)

        Alert.alert("Success", "Location sharing started!")
        loadActiveSession(currentUser.id)
      } else {
        await supabase
          .from("location_sessions")
          .update({ status: "rejected" })
          .eq("id", sessionId)

        Alert.alert("Info", "Session request rejected")
      }

      loadPendingSessions(currentUser.id)
      setShowSessionModal(false)
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  async function endLocationSharing() {
    if (!activeSession) return

    Alert.alert(
      "End Session",
      "Are you sure you want to stop sharing location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: async () => {
            try {
              const endTime = new Date()
              const startTime = new Date(activeSession.started_at)
              const durationSeconds = Math.floor((endTime - startTime) / 1000)

              await supabase
                .from("location_sessions")
                .update({
                  status: "ended",
                  ended_at: endTime.toISOString(),
                  duration_seconds: durationSeconds,
                })
                .eq("id", activeSession.id)

              // Update sharing history
              await updateSharingHistory(activeSession, durationSeconds)

              // Stop location tracking
              if (locationSubscription) {
                locationSubscription.remove()
                setLocationSubscription(null)
              }

              // Stop timer
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }

              setActiveSession(null)
              setFriendLocation(null)
              setChatMessages([])
              setSessionDuration(0)

              loadSharingHistory(currentUser.id)
              Alert.alert("Success", "Location sharing ended")
            } catch (error) {
              Alert.alert("Error", error.message)
            }
          },
        },
      ]
    )
  }

  async function updateSharingHistory(session, durationSeconds) {
    const user1 = session.initiator_id < session.participant_id 
      ? session.initiator_id 
      : session.participant_id
    const user2 = session.initiator_id < session.participant_id 
      ? session.participant_id 
      : session.initiator_id

    // Get message count
    const { count: messageCount } = await supabase
      .from("session_chats")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id)

    // Check if history exists
    const { data: existingHistory } = await supabase
      .from("sharing_history")
      .select("*")
      .eq("user1_id", user1)
      .eq("user2_id", user2)
      .single()

    if (existingHistory) {
      await supabase
        .from("sharing_history")
        .update({
          total_sessions: existingHistory.total_sessions + 1,
          total_duration_seconds: existingHistory.total_duration_seconds + durationSeconds,
          total_messages: existingHistory.total_messages + (messageCount || 0),
          last_session_at: new Date().toISOString(),
        })
        .eq("id", existingHistory.id)
    } else {
      await supabase.from("sharing_history").insert({
        user1_id: user1,
        user2_id: user2,
        total_sessions: 1,
        total_duration_seconds: durationSeconds,
        total_messages: messageCount || 0,
        last_session_at: new Date().toISOString(),
      })
    }
  }

  // ==================== LOCATION TRACKING ====================

  async function startLocationTracking(sessionId) {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      async (location) => {
        const { latitude, longitude } = location.coords
        
        setMyLocation({ latitude, longitude })

        // Save to database
        await supabase.from("session_locations").insert({
          session_id: sessionId,
          user_id: currentUser.id,
          latitude,
          longitude,
        })
      }
    )

    setLocationSubscription(subscription)
  }

  function startSessionTimer(startedAt) {
    const startTime = new Date(startedAt)
    
    timerRef.current = setInterval(() => {
      const now = new Date()
      const diffSeconds = Math.floor((now - startTime) / 1000)
      setSessionDuration(diffSeconds)
    }, 1000)
  }

  function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  // ==================== CHAT FUNCTIONS ====================

  async function sendMessage() {
    if (!newMessage.trim() || !activeSession) return

    try {
      await supabase.from("session_chats").insert({
        session_id: activeSession.id,
        sender_id: currentUser.id,
        message: newMessage.trim(),
      })

      setNewMessage("")
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  // ==================== MAP FUNCTIONS ====================

  function fitMapToMarkers() {
    if (!mapRef.current || !myLocation) return

    const markers = [myLocation]
    if (friendLocation) {
      markers.push(friendLocation)
    }

    mapRef.current.fitToCoordinates(markers, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    })
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: myLocation?.latitude || 0,
          longitude: myLocation?.longitude || 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* My Location Marker */}
        {myLocation && (
          <Marker
            coordinate={myLocation}
            title="You"
            pinColor="#4A90E2"
          >
            <View style={styles.myMarker}>
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Friend Location Marker */}
        {friendLocation && activeSession && (
          <Marker
            coordinate={friendLocation}
            title={
              activeSession.initiator_id === currentUser.id
                ? activeSession.participant?.display_name
                : activeSession.initiator?.display_name
            }
            pinColor="#E74C3C"
          >
            <View style={styles.friendMarker}>
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Path between users */}
        {myLocation && friendLocation && (
          <Polyline
            coordinates={[myLocation, friendLocation]}
            strokeColor="#4A90E2"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => setShowFriendsModal(true)}
        >
          <Ionicons name="people" size={24} color="#4A90E2" />
          <Text style={styles.topButtonText}>Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topButton, friendRequests.length > 0 && styles.hasNotification]}
          onPress={() => setShowRequestsModal(true)}
        >
          <Ionicons name="mail" size={24} color="#4A90E2" />
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topButton, pendingSessions.length > 0 && styles.hasNotification]}
          onPress={() => setShowSessionModal(true)}
        >
          <MaterialIcons name="share-location" size={24} color="#4A90E2" />
          {pendingSessions.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingSessions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topButton}
          onPress={() => setShowHistoryModal(true)}
        >
          <Ionicons name="time" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Active Session Bar */}
      {activeSession && (
        <View style={styles.sessionBar}>
          <View style={styles.sessionInfo}>
            <View style={styles.sessionHeader}>
              <Ionicons name="radio-button-on" size={12} color="#2ECC71" />
              <Text style={styles.sessionTitle}>
                Sharing with{" "}
                {activeSession.initiator_id === currentUser.id
                  ? activeSession.participant?.display_name
                  : activeSession.initiator?.display_name}
              </Text>
            </View>
            <Text style={styles.sessionDuration}>
              Duration: {formatDuration(sessionDuration)}
            </Text>
            {myLocation && friendLocation && (
              <Text style={styles.sessionDistance}>
                Distance:{" "}
                {calculateDistance(
                  myLocation.latitude,
                  myLocation.longitude,
                  friendLocation.latitude,
                  friendLocation.longitude
                )}{" "}
                km
              </Text>
            )}
          </View>
          
          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setShowChatModal(true)}
            >
              <Ionicons name="chatbubble" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fitButton}
              onPress={fitMapToMarkers}
            >
              <MaterialIcons name="fit-screen" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.endButton}
              onPress={endLocationSharing}
            >
              <Ionicons name="stop" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Friends Modal */}
      <Modal
        visible={showFriendsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friends</Text>
              <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Users */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by email or username"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text)
                  searchUsers(text)
                }}
              />
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                {searchResults.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.display_name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => sendFriendRequest(user.id)}
                    >
                      <Ionicons name="person-add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Friends List */}
            <Text style={styles.sectionTitle}>
              My Friends ({friends.length})
            </Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.friendItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.friend?.display_name}
                    </Text>
                    <Text style={styles.userEmail}>{item.friend?.email}</Text>
                  </View>
                  <View style={styles.friendActions}>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => startLocationSharing(item.friend_id)}
                    >
                      <MaterialIcons
                        name="share-location"
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFriend(item.friend_id)}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No friends yet</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Friend Requests Modal */}
      <Modal
        visible={showRequestsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friend Requests</Text>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.sender?.display_name}
                    </Text>
                    <Text style={styles.userEmail}>{item.sender?.email}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        handleFriendRequest(item.id, item.sender_id, true)
                      }
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() =>
                        handleFriendRequest(item.id, item.sender_id, false)
                      }
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No pending requests</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Session Requests Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location Sharing Requests</Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={pendingSessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.initiator?.display_name}
                    </Text>
                    <Text style={styles.requestText}>
                      wants to share location with you
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleSessionRequest(item.id, true)}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleSessionRequest(item.id, false)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No pending session requests</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChatModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.chatModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat</Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageItem,
                    item.sender_id === currentUser.id
                      ? styles.myMessage
                      : styles.theirMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.sender_id === currentUser.id
                        ? styles.myMessageText
                        : styles.theirMessageText,
                    ]}
                  >
                    {item.message}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No messages yet</Text>
              }
            />

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sharing History</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={sharingHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const friend =
                  item.initiator_id === currentUser.id
                    ? item.participant
                    : item.initiator
                return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyName}>
                        {friend?.display_name}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.ended_at).toLocaleDateString()}{" "}
                        {new Date(item.ended_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyStats}>
                      <View style={styles.historyStat}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.historyStatText}>
                          {formatDuration(item.duration_seconds)}
                        </Text>
                      </View>
                      <View style={styles.historyStat}>
                        <Ionicons name="chatbubble" size={16} color="#666" />
                        <Text style={styles.historyStatText}>
                          {item.messageCount} msgs
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No sharing history</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  map: {
    flex: 1,
  },
  myMarker: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "white",
  },
  friendMarker: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "white",
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  topButton: {
    alignItems: "center",
    padding: 8,
  },
  topButtonText: {
    fontSize: 10,
    color: "#4A90E2",
    marginTop: 2,
  },
  hasNotification: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  sessionBar: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 5,
  },
  sessionDuration: {
    fontSize: 12,
    color: "#666",
  },
  sessionDistance: {
    fontSize: 12,
    color: "#4A90E2",
    marginTop: 2,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 8,
  },
  chatButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 10,
  },
  fitButton: {
    backgroundColor: "#9B59B6",
    borderRadius: 20,
    padding: 10,
  },
  endButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
  },
  chatModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  searchResults: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  friendActions: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 8,
  },
  shareButton: {
    backgroundColor: "#2ECC71",
    borderRadius: 20,
    padding: 8,
  },
  removeButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    padding: 8,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#2ECC71",
    borderRadius: 20,
    padding: 8,
  },
  rejectButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 20,
  },
  chatList: {
    flex: 1,
    marginBottom: 10,
  },
  messageItem: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 15,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 14,
  },
  myMessageText: {
    color: "white",
  },
  theirMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    padding: 5,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 10,
  },
  historyItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  historyInfo: {
    marginBottom: 8,
  },
  historyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  historyStats: {
    flexDirection: "row",
    gap: 15,
  },
  historyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  historyStatText: {
    fontSize: 12,
    color: "#666",
  },
})