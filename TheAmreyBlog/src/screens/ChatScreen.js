import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { supabase } from '../config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme/useTheme';
import { createStyles } from '../Theme/createStyles';

export default function ChatScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const styles = createStyles(theme);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const flatListRef = useRef(null);

  // Store user avatar from Supabase
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    getCurrentUser();
    loadMessages();
    subscribeMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) console.error('Error getting user:', error);
    else {
      const user = data?.user ?? null;
      setCurrentUser(user);
      setUserAvatar(user?.user_metadata?.avatar_url || null); // get latest avatar
    }
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, message, created_at, auth_id, likes, dislikes')
      .order('created_at', { ascending: true });

    if (error) console.error('Error loading messages:', error);
    else setMessages(data || []);
  }

  function subscribeMessages() {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function send() {
    if (!text.trim() || !currentUser) return;

    const { error } = await supabase.from('chat_messages').insert({
      auth_id: currentUser.id,
      message: text.trim(),
      likes: 0,
      dislikes: 0,
    });

    if (error) console.error('Error sending message:', error);
    else {
      setText('');
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }

  async function likeMessage(id, likes = 0) {
    const newLikes = likes + 1;
    const { error } = await supabase
      .from('chat_messages')
      .update({ likes: newLikes })
      .eq('id', id);
    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, likes: newLikes } : m))
      );
    }
  }

  async function dislikeMessage(id, dislikes = 0) {
    const newDislikes = dislikes + 1;
    const { error } = await supabase
      .from('chat_messages')
      .update({ dislikes: newDislikes })
      .eq('id', id);
    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, dislikes: newDislikes } : m))
      );
    }
  }

  const renderItem = ({ item }) => {
    if (!currentUser) return null;
    const isMe = item.auth_id === currentUser.id;

    return (
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 12,
          alignItems: 'flex-end',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Avatar for others */}
        {!isMe && (
          <Image
            source={{
              uri:
                messages.find((m) => m.auth_id === item.auth_id)?.user_metadata?.avatar_url ||
                'https://ui-avatars.com/api/?name=U&background=random'
            }}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
          />
        )}

        <View
          style={{
            maxWidth: '75%',
            padding: 12,
            borderRadius: 15,
            backgroundColor: isMe ? theme.primary : theme.card,
          }}
        >
          <Text style={{ color: theme.text, fontSize: mode === 'reading' ? 18 : 16 }}>
            {item.message}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => likeMessage(item.id, item.likes)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
            >
              <Ionicons name="heart-outline" size={16} color="red" />
              <Text style={{ color: theme.text, fontSize: 12, marginLeft: 4 }}>
                {item.likes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => dislikeMessage(item.id, item.dislikes)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="thumbs-down-outline" size={16} color="blue" />
              <Text style={{ color: theme.text, fontSize: 12, marginLeft: 4 }}>
                {item.dislikes || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar for me */}
        {isMe && (
          <Image
            source={{
              uri: userAvatar || 'https://ui-avatars.com/api/?name=You&background=random'
            }}
            style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
          />
        )}
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { flex: 1 }]}
        behavior="padding"
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        {/* Header */}
        <View
          style={{
            marginTop: 25,
            width: '100%',
            padding: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.card,
            elevation: 4,
            marginBottom: 8,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>
            TheAmrey
          </Text>

          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={
                mode === 'light' ? 'moon-outline' :
                mode === 'dark' ? 'book-outline' :
                'sunny-outline'
              }
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          contentContainerStyle={{ padding: 15, paddingBottom: 90 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            backgroundColor: theme.card,
            borderTopWidth: 1,
            borderColor: theme.border,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 25,
              backgroundColor: theme.background,
              color: theme.text,
              marginRight: 10,
              fontSize: 16,
            }}
            placeholder="Type a message..."
            placeholderTextColor={theme.text + '80'}
            value={text}
            onChangeText={setText}
            multiline
          />

          <TouchableOpacity
            onPress={send}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}