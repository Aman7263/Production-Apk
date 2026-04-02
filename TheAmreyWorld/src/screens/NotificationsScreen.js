import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../Theme/ThemeContext';
import { supabase } from '../config/supabase';
import { API } from '../config/api';
import GlassCard from '../components/GlassCard';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserDataAndNotifications();
  }, []);

  const fetchUserDataAndNotifications = async () => {
    const user = await API.getUser();
    if (user) {
      setUser(user);

      // Fetch my partner info
      const pData = await API.getPartnerProfile(user.id);
      const myId = pData?.linked_id || "partner";

      let partnerName = "Partner";
      if (myId !== "partner") {
        const pnData = await API.getPartnerByPartnerId(myId);
        if (pnData?.user_metadata_name) partnerName = pnData.user_metadata_name;
      }

      const partnerLabel = `${partnerName} (${myId})`;

      // Fetch notifications
      const data = await API.getNotifications(user.id);
      if (data) setNotifications(data.map(n => ({ ...n, partnerLabel })));
    }
  };

  const handleAction = async (id, actionType, notification) => {
    try {
      await API.updateNotificationStatus(id, actionType);

      if (notification?.type === 'partner_request' && actionType === 'approved') {
        const myData = await API.getPartnerProfile(user.id);
        if (myData?.partner_id) {
          // Sync sender's linked_id to receiver's partner_id
          await API.updatePartnerLink(notification.sender_id, myData.partner_id);

          // Sync receiver's linked_id to sender's partner_id
          const senderData = await API.getPartnerProfile(notification.sender_id);
          if (senderData?.partner_id) {
            await API.updatePartnerLink(user.id, senderData.partner_id);
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

        if (updateError) throw updateError;
        Alert.alert("Success", "Location marked as completed!");
      }

      // Handle Map Location Deletion Requests
      if (notification?.type === 'permission' && notification?.action === 'delete_location' && actionType === 'approved') {
        await API.deleteLocation(notification.target_id);
        Alert.alert("Success", "Location deleted successfully!");
      }
      
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: actionType } : n));
    } catch (e) {
      Alert.alert("Action Error", e.message);
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
