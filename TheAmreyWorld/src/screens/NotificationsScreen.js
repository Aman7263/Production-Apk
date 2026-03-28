import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from '../config/supabase';
import GlassCard from '../components/GlassCard';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserDataAndNotifications();
  }, []);

  const fetchUserDataAndNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Fetch notifications where receiver_id is this user's ID
      // This is dynamic, assuming a 'notifications' table exists or can be created
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) setNotifications(data);
    }
  };

  const handleAction = async (id, actionType) => {
    // Approve or Deny
    const { error } = await supabase
      .from('notifications')
      .update({ status: actionType })
      .eq('id', id);

    if (!error) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: actionType } : n));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 15 }}>
      <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
      
      {notifications.length === 0 ? (
        <Text style={{ color: theme.text, marginTop: 20 }}>No new notifications.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={{ color: theme.text, fontSize: 16 }}>{item.message}</Text>
              
              {item.status === 'pending' ? (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleAction(item.id, 'approved')}
                  >
                    <Text style={styles.btnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: '#F44336' }]}
                    onPress={() => handleAction(item.id, 'denied')}
                  >
                    <Text style={styles.btnText}>Deny</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ color: item.status === 'approved' ? '#4CAF50' : '#F44336', marginTop: 10 }}>
                  Status: {item.status.toUpperCase()}
                </Text>
              )}
            </GlassCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, marginBottom: 15, borderRadius: 12 },
  actions: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  btn: { padding: 10, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
