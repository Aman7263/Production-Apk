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

export default function Chat({ navigation }) {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [userId, setUserId] = useState(null);
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
    const fetchSessionAndMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: pData } = await supabase
        .from("partners")
        .select("partner_id, linked_id")
        .eq("user_id", user.id)
        .single();

      const mappedPartnerId = pData?.partner_id;
      setPartnerId(mappedPartnerId);

      if (mappedPartnerId && pData?.linked_id) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .or(
            `partner_id.eq.${mappedPartnerId},partner_id.eq.${pData.linked_id}`
          )
          .order("created_at", { ascending: true });

        if (data) setMessages(data);
      }
    };

    fetchSessionAndMessages();
  }, []);

  const sendToPartner = async () => {
    if (!message.trim() || !partnerId || !userId) return;

    const newMessage = {
      content: message,
      sender_id: userId,
      partner_id: partnerId,
    };

    // Optimistic UI
    setMessages((prev) => [...prev, { id: Date.now(), ...newMessage }]);
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
            renderItem={({ item }) => {
              const isMe = item.sender_id === userId;

              return (
                <View
                  style={[
                    styles.messageRow,
                    {
                      justifyContent: isMe
                        ? "flex-end"
                        : "flex-start",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMe
                          ? theme.primary
                          : theme.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isMe
                          ? theme.buttonText
                          : theme.text,
                      }}
                    >
                      {item.content}
                    </Text>
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
              <Ionicons name="send" size={20} color="#fff" />
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
    padding: 12,
    borderRadius: 18,
    maxWidth: "75%",
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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