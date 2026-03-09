import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { supabase } from "../config/supabase";
import { useTheme } from "../Theme/useTheme";
import { createStyles } from "../Theme/createStyles";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentHistoryScreen({ route, navigation }) {
  const { userId } = route.params;
  const { theme, mode, toggleTheme } = useTheme();
  const styles = createStyles(theme);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("auth_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.log("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }) => (
    <View
      style={{
        padding: 15,
        marginVertical: 5,
        borderRadius: 12,
        backgroundColor: theme.card,
      }}
    >
      {/* Top: Amount & Status */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: theme.primary, fontWeight: "bold", fontSize: 16 }}>
          Amount: {item.amount} USD
        </Text>
        <Text style={{ color: theme.primary, fontWeight: "bold", fontSize: 16 }}>
          Status: {item.payment_status}
        </Text>
      </View>

      {/* Bottom: Initiated and Paid */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: theme.text, fontSize: 14 }}>
          Initiated: {new Date(item.payment_initiated_date).toLocaleDateString()}
        </Text>
        <Text style={{ color: theme.text, fontSize: 14 }}>
          Paid: {item.payment_date ? new Date(item.payment_date).toLocaleDateString() : "-"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { flex: 1, padding: 15 }]}>
      {/* Header */}
      <View
        style={{
          marginTop: 25,
          width: "100%",
          padding: 15,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: theme.card,
          elevation: 4,
          marginBottom: 10,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.primary }}>
          TheAmrey
        </Text>

        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons
            name={
              mode === "light"
                ? "moon-outline"
                : mode === "dark"
                ? "book-outline"
                : "sunny-outline"
            }
            size={28}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: theme.primary,
          marginBottom: 15,
          textAlign: "center",
        }}
      >
        Payment History
      </Text>

      {loading ? (
        <ActivityIndicator color={theme.primary} size="large" style={{ flex: 1, marginTop: 50 }} />
      ) : payments.length === 0 ? (
        <Text style={{ color: theme.text, textAlign: "center", marginTop: 20 }}>
          No payment history found.
        </Text>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}