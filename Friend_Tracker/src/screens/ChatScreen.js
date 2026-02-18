import React, { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { supabase } from "../config/supabase"

const { width, height } = Dimensions.get("window")

export default function ChatScreen({ navigation }) {
  // User state
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Friends & Conversations state
  const [friends, setFriends] = useState([])
  const [conversations, setConversations] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Chat state
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showChatModal, setShowChatModal] = useState(false)

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)

  const flatListRef = useRef(null)

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeChat()
    return () => cleanup()
  }, [])

  async function initializeChat() {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert("Error", "Please login first")
        navigation?.replace("Login")
        return
      }
      setCurrentUser(user)

      // Ensure user profile exists
      await ensureUserProfile(user)

      // Load data
      await Promise.all([
        loadFriends(user.id),
        loadFriendRequests(user.id),
        loadSentRequests(user.id),
        loadConversations(user.id),
      ])

      // Subscribe to realtime updates
      subscribeToUpdates(user.id)

      // Set user online
      await setUserOnline(user.id, true)

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
      const username = user.email?.split("@")[0] || "user"
      await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email,
        username: username,
        display_name: username,
        avatar_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
      })
    }
  }

  async function setUserOnline(userId, isOnline) {
    await supabase
      .from("user_profiles")
      .update({ 
        is_online: isOnline, 
        last_seen: new Date().toISOString() 
      })
      .eq("id", userId)
  }

  function cleanup() {
    if (currentUser) {
      setUserOnline(currentUser.id, false)
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================

  function subscribeToUpdates(userId) {
    // Subscribe to new messages
    supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (
            payload.new.sender_id === userId ||
            payload.new.receiver_id === userId
          ) {
            // If in active conversation
            if (
              selectedConversation &&
              payload.new.conversation_id === selectedConversation.id
            ) {
              setMessages((prev) => [...prev, payload.new])
              scrollToBottom()
            }
            // Refresh conversations list
            loadConversations(userId)
          }
        }
      )
      .subscribe()

    // Subscribe to friend requests
    supabase
      .channel("friend_requests_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          loadFriendRequests(userId)
        }
      )
      .subscribe()

    // Subscribe to friend request updates (accepted/rejected)
    supabase
      .channel("friend_requests_sent_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friend_requests",
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.status === "accepted") {
            loadFriends(userId)
            loadSentRequests(userId)
          }
        }
      )
      .subscribe()

    // Subscribe to user online status
    supabase
      .channel("user_profiles_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
        },
        () => {
          loadFriends(userId)
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
          id, email, username, display_name, avatar_url, is_online, last_seen
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
      .order("created_at", { ascending: false })

    if (!error && data) {
      setFriendRequests(data)
    }
  }

  async function loadSentRequests(userId) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        id,
        receiver_id,
        status,
        created_at,
        receiver:user_profiles!friend_requests_receiver_id_fkey (
          id, email, username, display_name, avatar_url
        )
      `)
      .eq("sender_id", userId)
      .eq("status", "pending")

    if (!error && data) {
      setSentRequests(data)
    }
  }

  async function loadConversations(userId) {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_at,
        user1:user_profiles!conversations_user1_id_fkey (
          id, email, username, display_name, avatar_url, is_online
        ),
        user2:user_profiles!conversations_user2_id_fkey (
          id, email, username, display_name, avatar_url, is_online
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false })

    if (!error && data) {
      // Get last message and unread count for each conversation
      const conversationsWithLastMessage = await Promise.all(
        data.map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("receiver_id", userId)
            .eq("is_read", false)

          const friend = conv.user1_id === userId ? conv.user2 : conv.user1

          return {
            ...conv,
            friend,
            lastMessage,
            unreadCount: unreadCount || 0,
          }
        })
      )

      setConversations(conversationsWithLastMessage)
    }
  }

  async function loadMessages(conversationId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMessages(data)
      scrollToBottom()

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", currentUser.id)
        .eq("is_read", false)
    }
  }

  // ==================== SEARCH FUNCTIONS ====================

  async function searchUsers(query) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq("id", currentUser.id)
        .limit(20)

      if (!error && data) {
        // Get friend IDs
        const friendIds = friends.map((f) => f.friend_id)
        
        // Get pending request receiver IDs
        const pendingReceiverIds = sentRequests.map((r) => r.receiver_id)
        
        // Filter and add status
        const resultsWithStatus = data.map((user) => ({
          ...user,
          isFriend: friendIds.includes(user.id),
          isPending: pendingReceiverIds.includes(user.id),
        }))

        setSearchResults(resultsWithStatus)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // ==================== FRIEND FUNCTIONS ====================

  async function sendFriendRequest(receiverId, receiverName) {
    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from("friend_requests")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .single()

      if (existing) {
        if (existing.status === "pending") {
          Alert.alert("Info", "Friend request already pending")
        } else if (existing.status === "rejected") {
          // Update existing rejected request to pending
          await supabase
            .from("friend_requests")
            .update({ status: "pending", updated_at: new Date().toISOString() })
            .eq("id", existing.id)
          Alert.alert("Success", `Friend request sent to ${receiverName}!`)
          loadSentRequests(currentUser.id)
        }
        return
      }

      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUser.id,
        receiver_id: receiverId,
      })

      if (error) throw error

      Alert.alert("Success", `Friend request sent to ${receiverName}!`)
      loadSentRequests(currentUser.id)
      
      // Update search results
      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === receiverId ? { ...user, isPending: true } : user
        )
      )
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
        loadFriends(currentUser.id)
      } else {
        await supabase
          .from("friend_requests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", requestId)

        Alert.alert("Info", "Friend request rejected")
      }

      loadFriendRequests(currentUser.id)
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  async function removeFriend(friendId, friendName) {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friendName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove both friendship directions
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

  // ==================== CONVERSATION FUNCTIONS ====================

  async function getOrCreateConversation(friendId) {
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUser.id})`)
        .single()

      if (existing) {
        return existing
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          user1_id: currentUser.id,
          user2_id: friendId,
        })
        .select()
        .single()

      if (error) throw error

      return newConv
    } catch (error) {
      console.error("Error getting/creating conversation:", error)
      throw error
    }
  }

  async function openChat(friend) {
    try {
      const conversation = await getOrCreateConversation(friend.id)
      setSelectedFriend(friend)
      setSelectedConversation(conversation)
      await loadMessages(conversation.id)
      setShowChatModal(true)
    } catch (error) {
      Alert.alert("Error", "Failed to open chat")
    }
  }

  function closeChat() {
    setShowChatModal(false)
    setSelectedFriend(null)
    setSelectedConversation(null)
    setMessages([])
    setNewMessage("")
    loadConversations(currentUser.id)
  }

  // ==================== MESSAGE FUNCTIONS ====================

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return

    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      // Insert message
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        receiver_id: selectedFriend.id,
        content: messageContent,
      })

      if (error) throw error

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id)

    } catch (error) {
      Alert.alert("Error", "Failed to send message")
      setNewMessage(messageContent)
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // ==================== HELPER FUNCTIONS ====================

  function formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  function formatLastSeen(dateString) {
    if (!dateString) return "Unknown"
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    return date.toLocaleDateString()
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          {/* Friend Requests Badge */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowRequestsModal(true)}
          >
            <Ionicons name="people" size={24} color="#4A90E2" />
            {friendRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friendRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends Section */}
      {friends.length > 0 && (
        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <FlatList
            horizontal
            data={friends}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.friendAvatar}
                onPress={() => openChat(item.friend)}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ 
                      uri: item.friend?.avatar_url || 
                        `https://ui-avatars.com/api/?name=${item.friend?.display_name}&background=random`
                    }}
                    style={styles.avatarImage}
                  />
                  {item.friend?.is_online && (
                    <View style={styles.onlineIndicator} />
                  )}
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {item.friend?.display_name?.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyFriends}>No friends yet</Text>
            }
          />
        </View>
      )}

      {/* Conversations List */}
      <View style={styles.conversationsSection}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => openChat(item.friend)}
            >
              <View style={styles.conversationAvatar}>
                <Image
                  source={{ 
                    uri: item.friend?.avatar_url || 
                      `https://ui-avatars.com/api/?name=${item.friend?.display_name}&background=random`
                  }}
                  style={styles.conversationImage}
                />
                {item.friend?.is_online && (
                  <View style={styles.onlineIndicatorSmall} />
                )}
              </View>

              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>
                    {item.friend?.display_name}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {item.lastMessage 
                      ? formatTime(item.lastMessage.created_at)
                      : formatTime(item.created_at)}
                  </Text>
                </View>
                <View style={styles.conversationFooter}>
                  <Text 
                    style={[
                      styles.lastMessage,
                      item.unreadCount > 0 && styles.unreadMessage
                    ]} 
                    numberOfLines={1}
                  >
                    {item.lastMessage?.sender_id === currentUser.id && "You: "}
                    {item.lastMessage?.content || "Start a conversation"}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Add friends and start chatting!
              </Text>
              <TouchableOpacity
                style={styles.addFriendsButton}
                onPress={() => setShowSearchModal(true)}
              >
                <Text style={styles.addFriendsButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Find Friends</Text>
              <TouchableOpacity onPress={() => {
                setShowSearchModal(false)
                setSearchQuery("")
                setSearchResults([])
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, username or email"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text)
                  searchUsers(text)
                }}
                autoCapitalize="none"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery("")
                  setSearchResults([])
                }}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {isSearching ? (
              <ActivityIndicator style={styles.searchLoader} color="#4A90E2" />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.searchResultItem}>
                    <Image
                      source={{ 
                        uri: item.avatar_url || 
                          `https://ui-avatars.com/api/?name=${item.display_name}&background=random`
                      }}
                      style={styles.searchResultImage}
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>
                        {item.display_name}
                      </Text>
                      <Text style={styles.searchResultUsername}>
                        @{item.username}
                      </Text>
                    </View>
                    
                    {item.isFriend ? (
                      <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                          setShowSearchModal(false)
                          openChat(item)
                        }}
                      >
                        <Ionicons name="chatbubble" size={18} color="white" />
                      </TouchableOpacity>
                    ) : item.isPending ? (
                      <View style={styles.pendingButton}>
                        <Text style={styles.pendingButtonText}>Pending</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={() => sendFriendRequest(item.id, item.display_name)}
                      >
                        <Ionicons name="person-add" size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  searchQuery.length >= 2 ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                  ) : (
                    <Text style={styles.searchHintText}>
                      Enter at least 2 characters to search
                    </Text>
                  )
                }
              />
            )}
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

            {/* Received Requests */}
            <Text style={styles.requestSectionTitle}>
              Received ({friendRequests.length})
            </Text>
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <Image
                    source={{ 
                      uri: item.sender?.avatar_url || 
                        `https://ui-avatars.com/api/?name=${item.sender?.display_name}&background=random`
                    }}
                    style={styles.requestImage}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {item.sender?.display_name}
                    </Text>
                    <Text style={styles.requestUsername}>
                      @{item.sender?.username}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleFriendRequest(item.id, item.sender_id, true)}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleFriendRequest(item.id, item.sender_id, false)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noRequestsText}>No pending requests</Text>
              }
            />

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <>
                <Text style={[styles.requestSectionTitle, { marginTop: 20 }]}>
                  Sent ({sentRequests.length})
                </Text>
                <FlatList
                  data={sentRequests}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.requestItem}>
                      <Image
                        source={{ 
                          uri: item.receiver?.avatar_url || 
                            `https://ui-avatars.com/api/?name=${item.receiver?.display_name}&background=random`
                        }}
                        style={styles.requestImage}
                      />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>
                          {item.receiver?.display_name}
                        </Text>
                        <Text style={styles.requestUsername}>
                          Pending...
                        </Text>
                      </View>
                    </View>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={closeChat}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatUserInfo}>
              <Image
                source={{ 
                  uri: selectedFriend?.avatar_url || 
                    `https://ui-avatars.com/api/?name=${selectedFriend?.display_name}&background=random`
                }}
                style={styles.chatUserImage}
              />
              <View>
                <Text style={styles.chatUserName}>
                  {selectedFriend?.display_name}
                </Text>
                <Text style={styles.chatUserStatus}>
                  {selectedFriend?.is_online 
                    ? "Online" 
                    : `Last seen ${formatLastSeen(selectedFriend?.last_seen)}`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => removeFriend(selectedFriend?.id, selectedFriend?.display_name)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollToBottom()}
            renderItem={({ item, index }) => {
              const isMe = item.sender_id === currentUser.id
              const showDate = index === 0 || 
                new Date(item.created_at).toDateString() !== 
                new Date(messages[index - 1]?.created_at).toDateString()

              return (
                <>
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <Text style={styles.dateSeparatorText}>
                        {new Date(item.created_at).toLocaleDateString([], {
                          weekday: "long",
                          month: "short",
                          day: "numeric"
                        })}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : styles.theirMessageText,
                      ]}
                    >
                      {item.content}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text
                        style={[
                          styles.messageTime,
                          isMe ? styles.myMessageTime : styles.theirMessageTime,
                        ]}
                      >
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {isMe && (
                        <Ionicons
                          name={item.is_read ? "checkmark-done" : "checkmark"}
                          size={14}
                          color={item.is_read ? "#4A90E2" : "#fff"}
                          style={styles.readIcon}
                        />
                      )}
                    </View>
                  </View>
                </>
              )
            }}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubble-outline" size={50} color="#ccc" />
                <Text style={styles.emptyChatText}>No messages yet</Text>
                <Text style={styles.emptyChatSubtext}>
                  Say hi to {selectedFriend?.display_name}!
                </Text>
              </View>
            }
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color="#4A90E2" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={newMessage.trim() ? "white" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  headerActions: {
    flexDirection: "row",
    gap: 15,
  },
  headerButton: {
    position: "relative",
    padding: 5,
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
  friendsSection: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 20,
    marginBottom: 10,
  },
  friendAvatar: {
    alignItems: "center",
    marginHorizontal: 10,
    width: 70,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2ECC71",
    borderWidth: 2,
    borderColor: "white",
  },
  friendName: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },
  emptyFriends: {
    marginLeft: 20,
    color: "#999",
    fontStyle: "italic",
  },
  conversationsSection: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 10,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conversationAvatar: {
    position: "relative",
  },
  conversationImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  onlineIndicatorSmall: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2ECC71",
    borderWidth: 2,
    borderColor: "white",
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  conversationTime: {
    fontSize: 12,
    color: "#999",
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#333",
  },
  unreadBadge: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  addFriendsButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  addFriendsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
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
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  searchLoader: {
    marginTop: 30,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  searchResultUsername: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 10,
  },
  addFriendButton: {
    backgroundColor: "#2ECC71",
    borderRadius: 20,
    padding: 10,
  },
  pendingButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pendingButtonText: {
    color: "#666",
    fontSize: 12,
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 30,
    fontSize: 15,
  },
  searchHintText: {
    textAlign: "center",
    color: "#999",
    marginTop: 30,
    fontSize: 14,
  },
  requestSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  requestImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  requestUsername: {
    fontSize: 13,
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
    padding: 10,
  },
  rejectButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    padding: 10,
  },
  noRequestsText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
    fontStyle: "italic",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chatUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  chatUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chatUserStatus: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 15,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#e4e6eb",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "white",
  },
  theirMessageText: {
    color: "#333",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  theirMessageTime: {
    color: "#999",
  },
  readIcon: {
    marginLeft: 4,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  attachButton: {
    padding: 5,
    marginRight: 5,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#f0f2f5",
  },
})