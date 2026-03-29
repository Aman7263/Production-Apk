import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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

      // Fetch my partner info
      const { data: pData } = await supabase.from('partners').select('linked_id').eq('user_id', user.id).single();
      const myId = pData?.linked_id || "partner";

      let partnerName = "Partner";
      if (myId !== "partner") {
        const { data: pnData } = await supabase.from('partners').select('user_metadata_name').eq('partner_id', myId).single();
        if (pnData?.user_metadata_name) partnerName = pnData.user_metadata_name;
      }

      const partnerLabel = `${partnerName} (${myId})`;

      // Fetch notifications where receiver_id OR sender_id is this user's ID
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data.map(n => ({ ...n, partnerLabel })));
    }
  };

  const handleAction = async (id, actionType, notification) => {
    // Approve or Deny
    const { error } = await supabase
      .from('notifications')
      .update({ status: actionType })
      .eq('id', id);

    if (!error) {
      if (notification?.type === 'partner_request' && actionType === 'approved') {
        const { data: myData } = await supabase.from('partners').select('partner_id').eq('user_id', user.id).single();
        if (myData?.partner_id) {
          // Sync sender's linked_id to receiver's partner_id
          await supabase.from('partners').update({ linked_id: myData.partner_id }).eq('user_id', notification.sender_id);

          // Sync receiver's linked_id to sender's partner_id
          const { data: senderData } = await supabase.from('partners').select('partner_id').eq('user_id', notification.sender_id).single();
          if (senderData?.partner_id) {
            await supabase.from('partners').update({ linked_id: senderData.partner_id }).eq('user_id', user.id);
          }

          Alert.alert("Success", "Partner connection established securely!");
        }
      }

      // Handle Map Completion Requests
      if (notification?.type === 'completion_request' && actionType === 'approved') {
        const { error: updateError } = await supabase
          .from('locations')
          .update({ completed_date: new Date() })
          .eq('id', notification.target_id);

        if (updateError) {
          Alert.alert("Error", "Failed to mark location as completed.");
        } else {
          Alert.alert("Success", "Location marked as completed!");
        }
      }

      // Handle Map Location Deletion Requests
      if (notification?.type === 'permission' && notification?.action === 'delete_location' && actionType === 'approved') {
        const { error: delError } = await supabase
          .from('locations')
          .delete()
          .eq('id', notification.target_id);

        if (delError) {
          Alert.alert("Error", "Failed to delete location.");
        } else {
          Alert.alert("Success", "Location deleted successfully!");
        }
      }
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: actionType } : n));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 15 }}>
      {/* Removed Redundant Header */}

      {notifications.length === 0 ? (
        <Text style={{ color: theme.text, marginTop: 20 }}>No new notifications.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isSender = item.sender_id === user?.id;
            const dateStr = new Date(item.created_at).toLocaleString();

            let displayMsg = item.message;
            const partnerLabel = item.partnerLabel;

            if (isSender) {
              if (item.type === 'partner_request') {
                displayMsg = `You sent a pairing request to ${partnerLabel}.`;
              } else if (item.type === 'completion_request') {
                displayMsg = `You sent a request to ${partnerLabel} for visit ${item.message}.`;
              } else {
                displayMsg = `You sent a request: ${item.message}`;
              }
            } else {
              if (item.type === 'completion_request') {
                displayMsg = `Request to visit ${item.message} with you by ${partnerLabel}.`;
              } else if (item.type === 'partner_request') {
                displayMsg = `You received a pairing request from ${partnerLabel}.`;
              }
            }

            return (
              <GlassCard style={styles.card}>
                <Text style={{ color: theme.text, fontSize: 16 }}>{displayMsg}</Text>

                <Text style={{ color: theme.text, opacity: 0.6, fontSize: 12, marginTop: 5 }}>
                  Sent on: {dateStr}
                </Text>

                {item.status === 'pending' ? (
                  isSender ? (
                    <Text style={{ color: '#FF9800', marginTop: 10, fontWeight: 'bold' }}>
                      Status: PENDING APPROVAL...
                    </Text>
                  ) : (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleAction(item.id, 'approved', item)}
                      >
                        <Text style={styles.btnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#F44336' }]}
                        onPress={() => handleAction(item.id, 'denied', item)}
                      >
                        <Text style={styles.btnText}>Deny</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <Text style={{ color: item.status === 'approved' ? '#4CAF50' : '#F44336', marginTop: 10, fontWeight: 'bold' }}>
                    Status: {item.status.toUpperCase()}
                  </Text>
                )}
              </GlassCard>
            );
          }}
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
