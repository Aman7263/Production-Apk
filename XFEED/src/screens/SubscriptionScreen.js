import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../config/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/useTheme';
import { createStyles } from '../Theme/createStyles';
import { Ionicons } from '@expo/vector-icons';
import { translateText } from '../config/translate';
import { initiatePayment } from '../config/paymentConfig'; // Importing initiatePayment
import { useNavigation } from '@react-navigation/native'; // Import for navigation

export default function SubscriptionScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('es'); // Default translation language
  const [texts, setTexts] = useState({
    header: 'TheAmrey',
    subscriptionTitle: 'Subscribe for Premium Access',
    payButton: 'Pay ₹199',
    success: 'Subscription Active 🎉',
    error: 'Error',
    paymentPending: 'Payment initiated – waiting for confirmation...',
    paymentFailed: 'Payment failed. Please try again.',
  });

  const navigation = useNavigation(); // Hook should be called at the top of the component

  // Translate texts when language changes
  useEffect(() => {
    translateAllTexts();
  }, [language]);

  // Helper function for translating all texts
  async function translateAllTexts() {
    try {
      const newTexts = {};
      for (const key in texts) {
        newTexts[key] = await translateText(texts[key], language);
      }
      setTexts(newTexts);
    } catch (err) {
      console.error('Translation failed:', err);
    }
  }

  // Handle payment and DB operations
  const handlePayment = async () => {
    setLoading(true);  // Set loading to true when starting the payment process

    try {
      // Step 1: Get the current user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Step 2: Insert a pending payment record into the DB
      const { data: paymentInsert, error: insertError } = await supabase
        .from('payments')
        .insert({
          auth_id: user.id,
          amount: 199,
          payment_status: 'pending',
          payment_initiated_date: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError || !paymentInsert) {
        throw new Error('Failed to create payment record');
      }

      const paymentRecordId = paymentInsert.id;

      // Step 3: Initiate payment (Razorpay / Stripe / your gateway)
      initiatePayment(199,
        async (paymentResponse) => {
          try {
            // Update payment record status to success after payment
            const { error: updateError } = await supabase
              .from('payments')
              .update({
                payment_status: 'success',
                payment_date: new Date().toISOString(),
                id: paymentResponse?.payment_id || paymentResponse?.id || null,
              })
              .eq('id', paymentRecordId);

            if (updateError) throw updateError;

             // Step for Grant premium access to the user in the DB
            const { error: accessError } = await supabase
              .from('users_access')
              .update({ access_id: '9900' })
              .eq('auth_id', user.id);

            if (accessError) {
              console.error('Access update failed:', accessError);
              Alert.alert(texts.error, 'Payment succeeded but access update failed.');
            } else {
              Alert.alert('Success', texts.success);
              navigation.replace('Dashboard'); // Navigate to Dashboard after success
            }

          } catch (err) {
            console.error('Success post-processing failed:', err);
            Alert.alert(texts.error, 'Payment may have succeeded – contact support.');
          } finally {
            setLoading(false);  // Reset loading state
          }
        },
        async (error) => {
          try {
            // If payment fails, update status to 'failed' in the DB
            await supabase
              .from('payments')
              .update({
                payment_status: 'failed',
                payment_date: new Date().toISOString(),
              })
              .eq('id', paymentRecordId);

            // Alert.alert(texts.error, texts.paymentFailed);
            Alert.alert("Currently we are facing payment issue, Please wait some times..");
          } catch (dbErr) {
            console.error('Failed to mark payment as failed:', dbErr);
          } finally {
            setLoading(false);  // Reset loading state
          }
        }
      );
    } catch (err) {
      console.error('Payment initiation failed:', err);
      Alert.alert(texts.error, err.message || 'Something went wrong');
      setLoading(false);  // Reset loading state
    }
  };

  return (
    <LinearGradient
      colors={[theme.primary + '40', theme.background]}
      style={[styles.container, { padding: 20, paddingTop: 40 }]}
    >
      {/* Header */}
      <View
        style={{
          width: '100%',
          padding: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          backgroundColor: theme.card,
          borderRadius: 12,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>
          {texts.header}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Language Toggle */}
          <TouchableOpacity
            onPress={() => setLanguage(language === 'es' ? 'fr' : 'es')}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
          {/* Theme Toggle */}
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={mode === 'light' ? 'moon-outline' : mode === 'dark' ? 'book-outline' : 'sunny-outline'}
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Card */}
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 25,
          elevation: 8,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 24,
            color: theme.primary,
            textAlign: 'center',
          }}
        >
          {texts.subscriptionTitle}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            width: '100%',
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {texts.payButton}
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 16,
            color: theme.text + '80',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Premium access • ₹199 one-time
        </Text>
      </View>
    </LinearGradient>
  );
}
