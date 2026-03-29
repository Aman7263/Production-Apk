import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../Theme/ThemeContext";
import { supabase } from "../config/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

export default function Chat({ navigation }) {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const flatListRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => handleCall("Audio")} style={styles.headerIconButton}>
            <Ionicons name="call" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCall("Video")} style={styles.headerIconButton}>
            <Ionicons name="videocam" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme]);

  const handleCall = (type) => {
    Alert.alert(`${type} Call`, "Calling your partner...");
  };

  useEffect(() => {
    let channel;

    const fetchSessionAndMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: pData } = await supabase
        .from("partners")
        .select("partner_id, linked_id")
        .eq("user_id", user.id)
        .single();

      if (!pData) return;

      const mappedPartnerId = pData.partner_id;
      const linkedId = pData.linked_id;
      setPartnerId(mappedPartnerId);

      // Fetch existing messages
      if (mappedPartnerId && linkedId) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .or(`partner_id.eq.${mappedPartnerId},partner_id.eq.${linkedId}`)
          .order("created_at", { ascending: true });

        if (data) {
          setMessages(data);
          markAsRead(data, user.id);
        }

        // --- REALTIME SUBSCRIPTION ---
        channel = supabase
          .channel('chat_performance')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
          }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages(prev => {
                const exists = prev.some(m => m.id === payload.new.id);
                if (exists) return prev;
                if (payload.new.sender_id !== user.id) markAsRead([payload.new], user.id);
                return [...prev, payload.new];
              });
            } else if (payload.eventType === 'UPDATE') {
              setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            } else if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            }
          })
          .subscribe();
      }
    };

    const markAsRead = async (msgs, currentUid) => {
      const unreadIds = msgs
        .filter(m => m.sender_id !== currentUid && !m.is_read)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    };

    fetchSessionAndMessages();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const pickImage = async (mode = "library") => {
    const permission = mode === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission denied", `Permission is required to access your ${mode}.`);
      return;
    }

    const result = mode === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (!result.canceled) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri) => {
    if (!uri || !partnerId || !userId) return;
    setUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop();
      const fileName = `chat_${userId}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage.from("avatars").upload(filePath, blob);
      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Send the message with the image URL
      const newMessage = {
        content: "[IMAGE]",
        image_url: publicUrl,
        sender_id: userId,
        partner_id: partnerId,
      };

      // Optimistic UI
      setMessages((prev) => [...prev, { id: Date.now(), ...newMessage, created_at: new Date().toISOString() }]);
      await supabase.from("messages").insert([newMessage]);
    } catch (e) {
      Alert.alert("Upload Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = (msgId, createdAt) => {
    const sentTime = new Date(createdAt);
    const diffMins = (new Date() - sentTime) / (1000 * 60);

    if (diffMins > 30) {
      Alert.alert("Time Limit", "You can only delete messages within 30 minutes.");
      return;
    }

    Alert.alert(
      "Delete Message",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const deletedText = `🚫 Sender deleted the message at ${timeStr}`;
            const { error } = await supabase
              .from("messages")
              .update({ content: deletedText, image_url: null, is_deleted: true })
              .eq("id", msgId);
            
            if (!error) {
              setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: deletedText, image_url: null, is_deleted: true } : m));
            }
          } 
        }
      ]
    );
  };

  const handleReaction = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    let reactions = { ...(msg.reactions || {}) };

    if (reactions[userId] === emoji) {
      // Toggle off (Undo)
      delete reactions[userId];
    } else {
      // Change or New
      reactions[userId] = emoji;
    }

    const { error } = await supabase
      .from("messages")
      .update({ reactions })
      .eq("id", msgId);

    if (!error) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m));
    }
  };

  const sendToPartner = async () => {
    if (!message.trim() || !partnerId || !userId) return;

    const newMessage = {
      content: message,
      sender_id: userId,
      partner_id: partnerId,
    };

    // Optimistic UI (add created_at for sorting/time)
    setMessages((prev) => [...prev, { id: Date.now(), ...newMessage, created_at: new Date().toISOString() }]);
    setMessage("");

    const { error } = await supabase.from("messages").insert([newMessage]);
    if (error) console.log(error);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        >
          {/* MESSAGES */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 12, paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item, index }) => {
              const isMe = item.sender_id === userId;
              const date = new Date(item.created_at);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateHeader = !prevMessage || new Date(prevMessage.created_at).toDateString() !== date.toDateString();

              return (
                <View>
                  {showDateHeader && (
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateHeaderText}>{dateStr}</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageRow,
                      { justifyContent: isMe ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onLongPress={() => isMe ? handleDeleteMessage(item.id, item.created_at) : null}
                        onPress={() => setSelectedMessageId(selectedMessageId === item.id ? null : item.id)}
                        style={[
                          styles.bubble,
                          {
                            backgroundColor: isMe ? theme.primary : theme.card,
                            borderBottomRightRadius: isMe ? 4 : 18,
                            borderBottomLeftRadius: isMe ? 18 : 4,
                          },
                        ]}
                      >
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={{ width: 200, height: 150, borderRadius: 10, marginBottom: 5 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{
                            color: isMe ? theme.buttonText : theme.text,
                            fontSize: 16,
                            fontStyle: item.content.includes("deleted") ? 'italic' : 'normal',
                            opacity: item.content.includes("deleted") ? 0.6 : 1
                          }}>
                            {item.content}
                          </Text>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 }}>
                          <Text style={{ color: isMe ? theme.buttonText : theme.text, fontSize: 10, opacity: 0.7 }}>
                            {timeStr}
                          </Text>
                          {isMe && (
                            <Ionicons
                              name={item.is_read ? "checkmark-done" : "checkmark"}
                              size={14}
                              color={item.is_read ? "#4BB543" : (isMe ? theme.buttonText : theme.text)}
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Reaction / Delete / Status Bar */}
                      {selectedMessageId === item.id && (
                        <View style={[styles.reactionBar, { backgroundColor: theme.card, alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', paddingRight: 5 }}>
                            <TouchableOpacity onPress={() => handleReaction(item.id, '❤️')}><Text style={styles.emoji}>❤️</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReaction(item.id, '👍')}><Text style={styles.emoji}>👍</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReaction(item.id, '😂')}><Text style={styles.emoji}>😂</Text></TouchableOpacity>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            {isMe ? (
                              <>
                                <TouchableOpacity onPress={() => handleDeleteMessage(item.id, item.created_at)}>
                                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                                </TouchableOpacity>
                                {item.is_read && item.read_at && (
                                  <View style={{ marginLeft: 10 }}>
                                    <Text style={{ fontSize: 9, color: theme.secondaryText }}>Seen: {new Date(item.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                  </View>
                                )}
                              </>
                            ) : (
                              <Text style={{ fontSize: 10, color: theme.secondaryText }}>Partner reacted?</Text>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Dislpay reactions */}
                      {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <View style={styles.reactionDisplay}>
                          {Object.values(item.reactions).map((emo, i) => (
                            <Text key={i} style={{ fontSize: 12 }}>{emo}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* INPUT */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.header,
                borderTopColor: theme.glow,
                paddingBottom: Platform.OS === "ios" ? 30 : 10,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Send Attachment",
                  "Choose an option",
                  [
                    { text: "Camera", onPress: () => pickImage("camera") },
                    { text: "Gallery", onPress: () => pickImage("library") },
                    { text: "Cancel", style: "cancel" }
                  ]
                );
              }}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="add-circle-outline" size={28} color={theme.primary} />
            </TouchableOpacity>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={theme.secondaryText}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.glow,
                  borderWidth: 1,
                },
              ]}
            />

            <TouchableOpacity
              onPress={sendToPartner}
              style={[
                styles.sendBtn,
                { backgroundColor: theme.primary },
              ]}
            >
              {uploading ? (
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  messageRow: {
    marginVertical: 5,
    flexDirection: "row",
  },
  bubble: {
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    maxWidth: "80%",
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },
  reactionBar: {
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 5,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  emoji: { fontSize: 18, marginHorizontal: 5 },
  reactionDisplay: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'absolute',
    bottom: -10,
    right: 5,
    borderWidth: 1,
    borderColor: '#eee'
  },
  inputWrapper: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 22,
    paddingHorizontal: 15,
  },
  sendBtn: {
    marginLeft: 10,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});