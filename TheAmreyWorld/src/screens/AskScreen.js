import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useTheme } from "../Theme/ThemeContext";
import { API } from "../config/api";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";

export default function AskScreen() {
  const { theme } = useTheme();
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendQuestion = async () => {
    if (!question.trim() || loading) return;

    const userMsg = question;
    setQuestion("");
    setLoading(true);

    const tempId = Date.now().toString();

    const tempMsg = {
      id: tempId,
      question: userMsg,
      answer: null,
      created_at: new Date().toISOString(),
    };

    setChat((prev) => [...prev, tempMsg]);

    try {
      let aiResponse = await API.askAI(userMsg);

      // ✅ FIX: Ensure response is string
      if (typeof aiResponse !== "string") {
        aiResponse =
          aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "⚠️ No response";
      }

      setChat((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, answer: aiResponse } : msg
        )
      );
    } catch (err) {
      console.error("Send Error:", err.message);

      setChat((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, answer: "⚠️ Error processing chat." }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [chat]);

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 15 }}>
      {/* USER */}
      <View style={{ alignItems: "flex-end" }}>
        <View style={styles.userBubble}>
          <Text style={{ color: "#fff" }}>{item.question}</Text>
        </View>
      </View>

      {/* AI */}
      <View style={{ alignItems: "flex-start", marginTop: 6 }}>
        <View style={styles.aiBubble}>
          {item.answer === null ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={{ color: theme.text }}>{item.answer}</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={{ flex: 1 }}
        >
          {/* CHAT */}
          <FlatList
            ref={flatListRef}
            data={chat}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              padding: 15,
              paddingBottom: 80,
            }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* INPUT BAR */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Type message..."
                placeholderTextColor="#888"
                style={[styles.input, { color: theme.text }]}
                multiline
              />

              <TouchableOpacity
                onPress={sendQuestion}
                disabled={loading || !question.trim()}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading || !question.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontSize: 18 }}>
                  {loading ? "..." : "➤"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  userBubble: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 16,
    maxWidth: "75%", // ✅ smaller width
  },
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 16,
    maxWidth: "75%", // ✅ fit content
  },
  inputWrapper: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "transparent",
  },
  inputRow: {
    flexDirection: "row", // ✅ same row
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
});