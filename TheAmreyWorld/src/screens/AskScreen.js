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
import { ThemeContext } from "../components/ThemeContext";
import { askGemini } from "../config/geminiService";
import { supabase } from "../config/supabase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AskScreen() {
  const { themeStyle } = useContext(ThemeContext);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  // Fetch chat history from Supabase custom schema
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .schema("theamreyworld")
        .from("chat_history")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setChat(data);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
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

      // 2. Save to Supabase custom schema
      const { data, error } = await supabase
        .schema("theamreyworld")
        .from("chat_history")
        .insert([{ question: userMsg, answer: aiResponse }])
        .select();

      if (error) throw error;

      // 3. Update UI with the saved DB record (replace tempMsg)
      if (data) {
        setChat((prev) =>
          prev.map((msg) => (msg.id === tempId ? data[0] : msg))
        );
      }
    } catch (err) {
      console.error("Send Error:", err.message);
      // Show error in chat bubble
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, answer: "Error saving chat." } : msg
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
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: themeStyle.background }}
        contentContainerStyle={{ flexGrow: 1, padding: 15 }}
        extraScrollHeight={Platform.OS === "ios" ? 90 : 120}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Chat Messages */}
          {chat.map((item) => (
            <View key={item.id} style={{ marginBottom: 20 }}>
              {/* User Message */}
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{item.question}</Text>
                <Text style={styles.timeText}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {/* AI Message */}
              <View
                style={[
                  styles.bubble,
                  styles.aiBubble,
                  { backgroundColor: themeStyle.footer },
                ]}
              >
                {item.answer === "..." ? (
                  <ActivityIndicator size="small" color={themeStyle.text} />
                ) : (
                  <Text style={{ color: themeStyle.text, lineHeight: 22 }}>
                    {item.answer}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {/* Input Area */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: themeStyle.header,
                borderColor: themeStyle.footer,
              },
            ]}
          >
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Type your message..."
              placeholderTextColor={themeStyle.text + "88"}
              style={[styles.input, { color: themeStyle.text }]}
              editable={!loading}
              multiline
            />
            <TouchableOpacity
              onPress={sendQuestion}
              disabled={loading || !question.trim()}
              style={[styles.sendBtn, { opacity: loading ? 0.5 : 1 }]}
            >
              <Text style={{ fontSize: 22 }}>
                {loading ? "⏳" : "📩"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
    marginTop: 8,
  },
  userText: {
    color: "#000",
    fontSize: 16,
  },
  timeText: {
    fontSize: 10,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
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