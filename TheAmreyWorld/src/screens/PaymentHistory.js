import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal } from "react-native";
import { useTheme } from "../Theme/ThemeContext";
import { supabase } from "../config/supabase";
import GlassCard from "../components/GlassCard";
import { LinearGradient } from "expo-linear-gradient";

export default function PaymentHistory({ route }) {
  const { theme } = useTheme();
  const userId = route.params?.userId;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pay");
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);

  // ✅ PLAN VALIDITY FUNCTION
  const getPlanValidity = (planName) => {
    switch (planName) {
      case "Basic Plan":
        return 30;
      case "Pro Plan":
        return 90;
      case "Lifetime":
        return null;
      default:
        return 0;
    }
  };

  // ✅ GET ACTIVE SUBSCRIPTION (LATEST + EXPIRY CHECK)
  const getActiveSubscription = () => {
    if (!payments || payments.length === 0) return null;

    const completedPayments = payments
      .filter(p => p.status === "completed")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (completedPayments.length === 0) return null;

    const latest = completedPayments[0];

    const validityDays = getPlanValidity(latest.plan);

    if (validityDays === null) return latest;

    const createdDate = new Date(latest.created_at);
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    const now = new Date();

    if (now <= expiryDate) return latest;

    return null;
  };

  // ✅ FINAL VALUES
  const activeSubscription = getActiveSubscription();
  const hasActiveSubscription = !!activeSubscription;
  const activePlan = activeSubscription?.plan;

  // ✅ OPTIONAL EXPIRY DISPLAY
  const getExpiryDate = (plan) => {
    if (!plan) return null;

    const validityDays = getPlanValidity(plan.plan);

    if (validityDays === null) return "Never";

    const createdDate = new Date(plan.created_at);
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    return expiryDate.toLocaleDateString();
  };

  const plans = [
    { id: '1', name: 'Basic Plan', amount: 9.99, desc: 'Live tracking & messages for 1 month' },
    { id: '2', name: 'Pro Plan', amount: 24.99, desc: 'Advanced AI features for 3 months' },
    { id: '3', name: 'Lifetime', amount: 99.99, desc: 'Unlimited access forever' }
  ];

  const fetchPayments = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [userId, activeTab]);

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert("Error", "Please select a plan to continue.");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from("payments").insert([{
        user_id: userId,
        amount: selectedPlan.amount,
        plan: selectedPlan.name,
        status: 'pending'
      }]);

      if (error) throw error;

      setQrVisible(true);
    } catch (err) {
      Alert.alert("Payment Failed", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFinishQr = async () => {
    setQrVisible(false);
    Alert.alert("Request Submitted", "Your payment is now Pending. Await admin approval.");
    setSelectedPlan(null);
    await fetchPayments();
    setActiveTab("history");
  };

  return (
    <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.container}>

      {/* Tab Selector (Repositioned below Global Header) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pay" && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setActiveTab("pay")}
        >
          <Text style={{ color: activeTab === "pay" ? theme.buttonText : theme.text, fontWeight: 'bold' }}>
            💳 Pay Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={{ color: activeTab === "history" ? theme.buttonText : theme.text, fontWeight: 'bold' }}>
            📜 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* PAY TAB */}
      {activeTab === "pay" && (
        <View style={{ flex: 1, padding: 20 }}>
          {hasActiveSubscription ? (
            <View style={styles.center}>
              <GlassCard intensity={80} style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ fontSize: 50 }}>🎉</Text>

                <Text style={{ color: theme.primary, fontSize: 20, fontWeight: "bold", marginTop: 15 }}>
                  Active Subscription
                </Text>

                <Text style={{ color: theme.text, marginTop: 10, textAlign: 'center' }}>
                  You currently hold the {activePlan}.
                </Text>

                <Text style={{ color: theme.text, marginTop: 5, fontSize: 12 }}>
                  Expires: {getExpiryDate(activeSubscription)}
                </Text>
              </GlassCard>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 18, color: theme.text, marginBottom: 15, fontWeight: "bold" }}>
                Select a Plan
              </Text>

              <FlatList
                data={plans}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const selected = selectedPlan?.id === item.id;
                  return (
                    <TouchableOpacity onPress={() => setSelectedPlan(item)}>
                      <GlassCard style={[styles.planCard, selected && { borderColor: theme.primary, borderWidth: 2 }]} intensity={80}>
                        <View style={styles.row}>
                          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
                          <Text style={{ color: theme.primary, fontSize: 18, fontWeight: "bold" }}>${item.amount}</Text>
                        </View>
                        <Text style={{ color: theme.text, opacity: 0.7, marginTop: 5 }}>{item.desc}</Text>
                      </GlassCard>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: theme.primary }, processing && { opacity: 0.7 }]}
                onPress={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={{ color: theme.background, fontSize: 18, fontWeight: "bold" }}>
                    Generate QR to Pay
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* HISTORY TAB (UNCHANGED) */}
      {activeTab === "history" && (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: theme.text }}>No payment history available.</Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 15 }}
              renderItem={({ item }) => (
                <GlassCard style={styles.card} intensity={80}>
                  <View style={styles.row}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>
                      {item.plan || "Service"}
                    </Text>
                    <Text style={{ color: item.status === "completed" ? "#4CAF50" : "#FF9800", fontWeight: "bold" }}>
                      ${item.amount}
                    </Text>
                  </View>

                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
                      Status: {item.status}
                    </Text>
                    <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </GlassCard>
              )}
            />
          )}
        </View>
      )}

      {/* QR MODAL (UNCHANGED) */}
      <Modal visible={qrVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.primary }}>
              Scan QR to Pay
            </Text>

            <View style={{ width: 200, height: 200, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
              <Text>QR MOCK</Text>
            </View>

            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: theme.primary, width: '100%' }]}
              onPress={handleFinishQr}
            >
              <Text style={{ color: theme.background }}>I Have Paid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  tabContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 10 },
  tab: { padding: 10, borderRadius: 20, borderWidth: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { padding: 15, marginBottom: 10 },
  planCard: { padding: 20, marginBottom: 10 },
  payButton: { padding: 15, borderRadius: 25, alignItems: "center", marginTop: 20 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  modalBg: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  modalContent: { width: "85%", padding: 20, borderRadius: 20, alignItems: "center" }
});