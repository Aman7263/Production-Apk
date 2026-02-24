import React, { useState, useContext, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet } from "react-native";
import { ThemeContext } from "../components/ThemeContext";
import { supabase } from "../config/supabase";

export default function Chat() {
  const { themeStyle } = useContext(ThemeContext);
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
    <View style={{ flex: 1, backgroundColor: themeStyle.background }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={[styles.bubble, { backgroundColor: themeStyle.card }]}>
            <Text style={{ color: themeStyle.text }}>{item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1, padding: 10 }}
      />
      <View style={[styles.inputArea, { borderTopWidth: 1, borderTopColor: themeStyle.footer }]}>
        <TextInput 
          value={message} 
          onChangeText={setMessage} 
          style={[styles.input, { color: themeStyle.text, borderColor: themeStyle.primary }]} 
          placeholder="Type to partner..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={sendToPartner} style={styles.btn}>
          <Text style={{ color: themeStyle.primary, fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, marginVertical: 5, borderRadius: 15, alignSelf: 'flex-end', maxWidth: '80%' },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 45 },
  btn: { marginLeft: 10 }
});