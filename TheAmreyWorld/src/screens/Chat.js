import React, { useState, useContext, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet } from "react-native";
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from "../config/supabase";
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';

export default function Chat() {
  const { theme  } = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Fetch messages from Supabase
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, []);

  const sendToPartner = async () => {
    if (!message.trim()) return;
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("messages").insert([
      { content: message, sender_id: user.id }
    ]);
    if (!error) setMessage("");
  };

  return (
    <LinearGradient 
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <GlassCard style={styles.bubble} tint="light" intensity={40}>
            <Text style={{ color: theme.text, fontSize: 16 }}>{item.content}</Text>
          </GlassCard>
        )}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1, padding: 10 }}
      />
      <GlassCard 
        intensity={60} 
        style={[
          styles.inputArea, 
          { 
            borderRadius: 0,
            borderTopWidth: 1, 
            borderTopColor: theme.glow,
            backgroundColor: theme.header 
          }
        ]}>
        <TextInput 
          value={message} 
          onChangeText={setMessage} 
          style={[styles.input, { color: theme.text, borderColor: theme.glow }]} 
          placeholder="Type to partner..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={sendToPartner} style={styles.btn}>
          <Text style={{ color: theme.glow, fontWeight: "bold", textShadowColor: theme.glow, textShadowRadius: 10 }}>Send</Text>
        </TouchableOpacity>
      </GlassCard>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, marginVertical: 5, borderRadius: 15, alignSelf: 'flex-end', maxWidth: '80%' },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 45 },
  btn: { marginLeft: 10 }
});