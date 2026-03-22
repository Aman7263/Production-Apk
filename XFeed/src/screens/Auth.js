import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../service/supabase';
import { GlobalStyles, ThemeColors } from '../theme';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email for the confirmation link. You may now login if auto-login is enabled.');
            }
        } catch (error) {
            Alert.alert('Authentication Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={GlobalStyles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            contentContainerStyle={{ flex: 1 }}
        >
            <View style={styles.container}>
                <Text style={GlobalStyles.title}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>
                
                <Text style={GlobalStyles.subText}>
                    {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
                </Text>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={ThemeColors.textDim}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={ThemeColors.textDim}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity 
                        style={[GlobalStyles.button, styles.mainButton, loading && { opacity: 0.7 }]} 
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={GlobalStyles.buttonText}>
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.switchButton} 
                        onPress={() => setIsLogin(!isLogin)}
                        disabled={loading}
                    >
                        <Text style={styles.switchText}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={styles.switchTextBold}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    formContainer: {
        marginTop: 40,
    },
    label: {
        color: ThemeColors.textDim,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: ThemeColors.surfaceDark,
        borderRadius: 14,
        padding: 16,
        color: ThemeColors.text,
        borderWidth: 1,
        borderColor: ThemeColors.border,
        marginBottom: 20,
        fontSize: 16,
    },
    mainButton: {
        marginTop: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
    switchText: {
        color: ThemeColors.textDim,
        fontSize: 14,
    },
    switchTextBold: {
        color: ThemeColors.primary,
        fontWeight: 'bold',
    },
});
