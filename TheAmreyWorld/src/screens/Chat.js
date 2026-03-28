import React, { useState, useContext, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from "../config/supabase";
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';

export default function Chat() {
  const { theme  } = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchSessionAndMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: pData } = await supabase.from('partners').select('partner_id, linked_id').eq('user_id', user.id).single();
      const mappedPartnerId = pData ? pData.partner_id : null;
      setPartnerId(mappedPartnerId);

      if (mappedPartnerId && pData.linked_id) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .or(`partner_id.eq.${mappedPartnerId},partner_id.eq.${pData.linked_id}`)
          .order("created_at", { ascending: true });
        if (data) setMessages(data);
      }
    };
    fetchSessionAndMessages();
  }, []);

  const sendToPartner = async () => {
    if (!message.trim() || !partnerId || !userId) return;
    const newMessage = { content: message, sender_id: userId, partner_id: partnerId };
    
    // Optional: Optimistic update
    setMessages(prev => [...prev, { id: Date.now(), ...newMessage }]);
    
    const { error } = await supabase.from("messages").insert([newMessage]);
    if (!error) setMessage("");
  };

  const handleCall = (type) => {
    // In a real app, this would integrate WebRTC or a service like Agora/ZegoCloud
    Alert.alert(`${type} Call`, `Calling your partner...`);
  };

  return (
    <LinearGradient 
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1 }}>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        <View style={[styles.headerActions, { backgroundColor: theme.header }]}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Partner Chat</Text>
          <View style={styles.callButtons}>
            <TouchableOpacity onPress={() => handleCall('Audio')} style={styles.actionBtn}>
              <Text style={{ fontSize: 20 }}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleCall('Video')} style={styles.actionBtn}>
              <Text style={{ fontSize: 20 }}>📹</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <GlassCard 
              style={[
                styles.bubble, 
                { 
                  alignSelf: item.sender_id === userId ? 'flex-end' : 'flex-start',
                  backgroundColor: item.sender_id === userId ? theme.primary : theme.card,
                }
              ]} 
              tint={item.sender_id === userId ? "dark" : "light"} 
              intensity={80}
            >
              <Text style={{ color: item.sender_id === userId ? theme.buttonText : theme.text, fontSize: 16 }}>{item.content}</Text>
            </GlassCard>
          )}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          style={{ flex: 1, padding: 10 }}
        />
        <GlassCard 
          intensity={80} 
          style={[
            styles.inputArea, 
            { 
              borderRadius: 0,
              borderTopWidth: 1, 
              borderTopColor: theme.primary + "30",
              backgroundColor: theme.header 
            }
          ]}>
          <TextInput 
            value={message} 
            onChangeText={setMessage} 
            style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.background + "50" }]} 
            placeholder="Type to partner..."
            placeholderTextColor={theme.secondaryText}
          />
          <TouchableOpacity onPress={sendToPartner} style={styles.btn}>
            <Text style={{ color: theme.primary, fontWeight: "bold", fontSize: 16 }}>Send</Text>
          </TouchableOpacity>
        </GlassCard>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, paddingTop: 50, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  callButtons: { flexDirection: 'row' },
  actionBtn: { marginLeft: 15, padding: 5 },
  bubble: { padding: 12, marginVertical: 5, borderRadius: 15, maxWidth: '80%' },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 45 },
  btn: { marginLeft: 10 }
});