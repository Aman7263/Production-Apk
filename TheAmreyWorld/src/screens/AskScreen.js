import React, { useState, useContext, useRef, useEffect } from "react";
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
import { useTheme } from '../Theme/ThemeContext';
import { askGemini } from "../config/geminiService";
import { supabase } from "../config/supabase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GradientText from '../components/GradientText';

export default function AskScreen() {
  const { theme  } = useTheme();
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  // We are keeping this purely stateful as 'chat_history' table wasn't in the schema
  useEffect(() => {
    // Initial greeting could go here if needed.
  }, []);

  const sendQuestion = async () => {
    if (!question.trim() || loading) return;

    const userMsg = question;
    setQuestion("");
    setLoading(true);

    // Optimistic Update: show user message immediately
    const tempId = Date.now().toString();
    const tempMsg = {
      id: tempId,
      question: userMsg,
      answer: "...",
      created_at: new Date().toISOString(),
    };
    setChat((prev) => [...prev, tempMsg]);

    try {
      // 1. Get Gemini Response
      const aiResponse = await askGemini(userMsg);

      // 2. Update UI directly without querying missing table
      const finalMsg = { ...tempMsg, answer: aiResponse };
      
      setChat((prev) =>
        prev.map((msg) => (msg.id === tempId ? finalMsg : msg))
      );
    } catch (err) {
      console.error("Send Error:", err.message);
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, answer: "Error processing chat." } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom whenever chat updates
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chat]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 15 }}
          extraScrollHeight={Platform.OS === "ios" ? 90 : 120}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <GradientText style={{ fontSize: 28, fontWeight: 'bold' }}>Ask AI</GradientText>
            </View>

            {/* Chat Messages */}
            {chat.map((item) => (
              <View key={item.id} style={{ marginBottom: 20 }}>
                {/* User Message */}
                <GlassCard style={styles.userBubble} intensity={80}>
                  <Text style={styles.userText}>{item.question}</Text>
                  <Text style={[styles.timeText, { color: theme.background }]}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </GlassCard>

                {/* AI Message */}
                <GlassCard style={styles.aiBubble} tint="light" intensity={30}>
                  {item.answer === "..." ? (
                    <ActivityIndicator size="small" color={theme.glow} />
                  ) : (
                    <Text style={{ color: theme.text, lineHeight: 22 }}>
                      {item.answer}
                    </Text>
                  )}
                </GlassCard>
              </View>
            ))}

            {/* Input Area */}
            <GlassCard style={styles.inputContainer} intensity={60}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Type your message..."
                placeholderTextColor={theme.text + "88"}
                style={[styles.input, { color: theme.text }]}
                editable={!loading}
                multiline
              />
              <TouchableOpacity
                onPress={sendQuestion}
                disabled={loading || !question.trim()}
                style={[styles.sendBtn, { opacity: loading ? 0.5 : 1 }]}
              >
                <Text style={{ fontSize: 26, textShadowColor: theme.glow, textShadowRadius: 10 }}>
                  {loading ? "⏳" : "✨"}
                </Text>
              </TouchableOpacity>
            </GlassCard>

          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 2,
    maxWidth: "85%",
    padding: 0
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
    marginTop: 8,
    maxWidth: "85%",
    padding: 0
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    marginTop: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 10 : 0,
  },
  sendBtn: {
    marginLeft: 10,
    padding: 5,
  },
});