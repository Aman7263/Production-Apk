import React, { useState } from "react"
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Alert, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView
} from "react-native"
import { supabase } from "../config/supabase"
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Create or update user profile after authentication
  async function createUserProfile(user) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!existingProfile) {
        // Create new profile
        const profileUsername = username || email.split("@")[0]
        const profileDisplayName = displayName || profileUsername
        
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email,
            username: profileUsername.toLowerCase(),
            display_name: profileDisplayName,
            avatar_url: `https://ui-avatars.com/api/?name=${profileDisplayName}&background=random`,
            is_online: true,
            last_seen: new Date().toISOString(),
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't block login if profile creation fails
        }
      } else {
        // Update last seen and online status
        await supabase
          .from("user_profiles")
          .update({
            is_online: true,
            last_seen: new Date().toISOString()
          })
          .eq("id", user.id)
      }
    } catch (error) {
      console.error("Profile management error:", error)
    }
  }

  // Email/Password Login
  async function handleSupabaseLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password")
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error

      if (data?.user) {
        await createUserProfile(data.user)
        navigation.replace("Home")
      }
    } catch (error) {
      Alert.alert("Login Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Email/Password Signup
  async function handleSupabaseSignUp() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    if (isSignUp && !username) {
      Alert.alert("Error", "Please choose a username")
      return
    }

    setLoading(true)

    try {
      // Check if username is available (if in signup mode)
      if (isSignUp && username) {
        const { data: existingUser } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .single()

        if (existingUser) {
          Alert.alert("Error", "Username is already taken")
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
            display_name: displayName || username || email.split("@")[0],
          }
        }
      })
      
      if (error) throw error

      if (data?.user) {
        // Create user profile immediately
        await createUserProfile(data.user)
        
        if (data.user.confirmed_at) {
          // Auto-confirmed (no email verification required)
          navigation.replace("Home")
        } else {
          Alert.alert(
            "Success", 
            "Sign up successful! Please check your email to confirm your account.",
            [{ text: "OK", onPress: () => setIsSignUp(false) }]
          )
        }
      }
    } catch (error) {
      Alert.alert("Sign Up Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Login
  async function handleGoogleLogin() {
    setLoading(true)
    
    try {
      const redirectUrl = makeRedirectUri({
        path: '/auth/callback'
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })
      
      if (error) throw error

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
          }
        )

        if (result.type === 'success') {
          const url = result.url
          
          // Extract tokens from URL
          const params = new URLSearchParams(url.split('#')[1])
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          
          if (access_token) {
            // Set the session
            const { data: sessionData, error: sessionError } = 
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              })
            
            if (!sessionError && sessionData?.user) {
              await createUserProfile(sessionData.user)
              navigation.replace("Home")
            }
          }
        }
      }
    } catch (error) {
      Alert.alert("OAuth Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Check username availability
  async function checkUsernameAvailability() {
    if (!username || username.length < 3) return

    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .single()

      if (data) {
        Alert.alert("Username Taken", "This username is already in use")
      }
    } catch (error) {
      // Username is available (no data found)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="chatbubbles" size={60} color="#4A90E2" />
          </View>
          <Text style={styles.appName}>FriendTracker</Text>
          <Text style={styles.tagline}>Stay Connected, Share Moments</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? "Sign up to start tracking and chatting" 
              : "Login to continue"
            }
          </Text>

          {/* Username field (only for signup) */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                onBlur={checkUsernameAvailability}
                style={styles.input}
                placeholder="Choose a username"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
          )}

          {/* Display Name field (only for signup) */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                placeholder="Display name (optional)"
                autoCapitalize="words"
                maxLength={30}
              />
            </View>
          )}

          {/* Email field */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password field */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder={isSignUp ? "Password (min 6 characters)" : "Password"}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>

          {/* Main Action Button */}
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={isSignUp ? handleSupabaseSignUp : handleSupabaseLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? "Sign Up" : "Login"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle between Login and Signup */}
          <TouchableOpacity 
            onPress={() => {
              setIsSignUp(!isSignUp)
              setUsername("")
              setDisplayName("")
              setPassword("")
            }}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isSignUp 
                ? "Already have an account? Login" 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login */}
          <TouchableOpacity 
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Image 
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          {!isSignUp && (
            <TouchableOpacity 
              onPress={() => {
                if (!email) {
                  Alert.alert("Error", "Please enter your email first")
                  return
                }
                
                supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
                  .then(() => {
                    Alert.alert(
                      "Password Reset",
                      "Check your email for password reset instructions"
                    )
                  })
                  .catch((error) => {
                    Alert.alert("Error", error.message)
                  })
              }}
              disabled={loading}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleText: {
    textAlign: 'center',
    color: '#4A90E2',
    fontSize: 14,
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#4A90E2',
    fontSize: 14,
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
})

// Helper function to get current user
export async function getUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Get full profile data
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      return { ...user, profile }
    }
    return null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

// Helper function to logout
export async function logout() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Update user online status
      await supabase
        .from("user_profiles")
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq("id", user.id)
    }
    
    // Sign out
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

// Helper function to check if user is logged in
export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    return false
  }
}

// Session listener for auto-navigation
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}