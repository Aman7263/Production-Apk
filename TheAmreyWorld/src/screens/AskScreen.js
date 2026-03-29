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
} from "react-native";
import { useTheme } from "../Theme/ThemeContext";
import { askGemini } from "../config/geminiService";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import GradientText from "../components/GradientText";

export default function AskScreen() {
  const { theme } = useTheme();
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
      const aiResponse = await askGemini(userMsg);

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

  // ✅ Smooth auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chat]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView
          ref={scrollRef} // ✅ FIXED (no innerRef)
          contentContainerStyle={{
            flexGrow: 1,
            padding: 15,
            paddingBottom: 100,
          }}
          extraScrollHeight={100}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1 }}>
            {/* Title */}
            {/* Removed Redundant Header */}

            {/* Chat Messages */}
            {chat.map((item) => (
              <View key={item.id} style={{ marginBottom: 20 }}>
                {/* USER */}
                <GlassCard
                  style={[
                    styles.userBubble,
                    { backgroundColor: theme.primary },
                  ]}
                  intensity={100}
                  tint="dark"
                >
                  <Text
                    style={[
                      styles.userText,
                      { color: theme.buttonText },
                    ]}
                  >
                    {item.question}
                  </Text>

                  <Text
                    style={[
                      styles.timeText,
                      { color: theme.buttonText, opacity: 0.7 },
                    ]}
                  >
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </GlassCard>

                {/* AI */}
                <GlassCard
                  style={[
                    styles.aiBubble,
                    { backgroundColor: theme.card },
                  ]}
                  intensity={30}
                  tint="light"
                >
                  {item.answer === null ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Text
                        style={{
                          color: theme.text,
                          lineHeight: 22,
                        }}
                      >
                        {item.answer}
                      </Text>

                      <Text
                        style={[
                          styles.timeText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </>
                  )}
                </GlassCard>
              </View>
            ))}

            {/* Input */}
            <View
              style={{
                marginBottom: Platform.OS === "ios" ? 20 : 30,
              }}
            >
              <GlassCard
                style={styles.inputContainer}
                intensity={90}
                tint={
                  theme.currentTheme === "dark" ? "dark" : "light"
                }
              >
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Type your message..."
                  placeholderTextColor={theme.secondaryText}
                  style={[styles.input, { color: theme.text }]}
                  editable={!loading}
                  multiline
                />

                <TouchableOpacity
                  onPress={sendQuestion}
                  disabled={loading || !question.trim()}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity:
                        loading || !question.trim() ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: theme.buttonText,
                    }}
                  >
                    {loading ? "⏳" : "➤"}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    marginTop: 8,
    maxWidth: "85%",
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});