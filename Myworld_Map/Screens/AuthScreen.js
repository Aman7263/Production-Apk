import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebase';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithCredential,
  signInAnonymously,
  GoogleAuthProvider
} from 'firebase/auth';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [confirmation, setConfirmation] = useState(null);
  const [code, setCode] = useState('');

  // Email/Password Authentication
  const handleEmailAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created successfully!');
      }
      navigation.navigate('Save');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Phone Authentication - Step 1: Send Verification Code
  const handlePhoneAuth = async () => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
      setConfirmation(confirmationResult);
      Alert.alert('Code Sent', 'Please enter the verification code sent to your phone.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Phone Authentication - Step 2: Verify Code
  const confirmPhoneCode = async () => {
    try {
      if (confirmation) {
        await confirmation.confirm(code);
        Alert.alert('Success', 'Phone authentication successful!');
        setConfirmation(null);
        setCode('');
        navigation.navigate('Save');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Google Authentication
  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
      Alert.alert('Success', 'Signed in with Google!');
      navigation.navigate('Save');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Anonymous Authentication
  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      Alert.alert('Success', 'Signed in anonymously!');
      navigation.navigate('Save');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>
      
      {/* Email/Password Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={isLogin ? 'Login with Email' : 'Register with Email'}
        onPress={handleEmailAuth}
        disabled={!email || !password}
      />
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>

      {/* Phone Input */}
      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., +1234567890)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <Button
        title="Send Verification Code"
        onPress={handlePhoneAuth}
        disabled={!phoneNumber}
      />
      {confirmation && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <Button
            title="Confirm Code"
            onPress={confirmPhoneCode}
            disabled={!code}
          />
        </>
      )}

      {/* Google and Anonymous Sign-In */}
      <View style={styles.buttonContainer}>
        <GoogleSigninButton
          style={{ width: 200, height: 48 }}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleSignIn}
        />
        <Button
          title="Sign in Anonymously"
          onPress={handleAnonymousSignIn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  toggleText: {
    color: 'blue',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});