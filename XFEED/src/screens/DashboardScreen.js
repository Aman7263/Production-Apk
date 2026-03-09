import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useTheme } from '../Theme/useTheme';
import { createStyles } from '../Theme/createStyles';
import { translateText } from '../config/translate';
import ProfileScreen from './ProfileScreen';

const { width } = Dimensions.get('window');
const BOX_SIZE = (width - 60) / 3;

export default function DashboardScreen({ navigation }) {
  const { theme, toggleTheme, mode } = useTheme();
  const styles = createStyles(theme);

  const [access, setAccess] = useState('0516');
  const [language, setLanguage] = useState('es'); // Default translation language

  const [translatedTexts, setTranslatedTexts] = useState({
    welcome: 'Welcome To Dashboard 💖',
    blogger: 'Blogger',
    otherContent: 'Other Content',
    yourContent: 'Your Content',
    premiumChat: 'Premium Chat',
    subscribe: 'Subscribe',
    ProfileScreen: 'Profile',
    logout: 'Logout',
  });

  useEffect(() => {
    getAccess();
    translateAllTexts();
  }, []);

  useEffect(() => {
    // Re-translate when language changes
    translateAllTexts();
  }, [language]);

  async function getAccess() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data } = await supabase
      .from('users_access')
      .select('access_id')
      .eq('auth_id', user.id)
      .single();

    if (data) setAccess(data.access_id);
  }

  async function translateAllTexts() {
    const keys = Object.keys(translatedTexts);
    const newTexts = {};

    for (let key of keys) {
      newTexts[key] = await translateText(translatedTexts[key], language);
    }

    setTranslatedTexts(newTexts);
  }

  const bloggerSubItems = [
    { title: 'Kids', type: 'ContentList', subType: 'blogger_kids', icon: 'happy-outline' },
    { title: 'Youth', type: 'ContentList', subType: 'blogger_youth', icon: 'flash-outline' },
    { title: 'Golden', type: 'ContentList', subType: 'blogger_golden', icon: 'star-outline' },
  ];

  const otherContentItems = [
    { title: 'Shayari', type: 'ContentList', subType: 'blogger_shayari', icon: 'book-outline' },
    { title: 'News', type: 'ContentList', subType: 'blogger_news', icon: 'newspaper-outline' },
    { title: 'Songs', type: 'ContentList', subType: 'blogger_songs', icon: 'musical-notes-outline' },
  ];

  // Updated navigation handler
  const handleNavigation = (type, subType, heading) => {
    if (type === 'Chat') navigation.navigate('Chat');
    else if (type === 'Subscription') navigation.navigate('Subscription');
    else if (type === 'Profile') navigation.navigate('ProfileScreen'); // 👈 add this
    else if (type === 'ContentList')
      navigation.navigate('ContentList', { type: subType, heading });
  };

  const renderBox = (item, bgColor, translatedTitle) => (
    <TouchableOpacity
      key={item.title}
      style={{
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: 16,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bgColor,
        elevation: 5,
      }}
      onPress={() => handleNavigation(item.type, item.subType, item.title)}
    >
      <Ionicons name={item.icon} size={40} color="#fff" />
      <Text style={styles.boxText}>{translatedTitle || item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[theme.background, theme.card]} style={styles.container}>
      {/* Header */}
      <View
        style={{
          marginTop: 25,
          width: '100%',
          padding: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          elevation: 5,
          backgroundColor: theme.card,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>TheAmrey</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'es' ? 'fr' : 'es')}
            style={{ marginRight: 10 }}
          >
            <Text style={{ color: theme.primary }}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>{translatedTexts.welcome}</Text>

        {/* Blogger Section */}
        <Text style={styles.sectionHeader}>{translatedTexts.blogger}</Text>
        <View style={styles.grid}>
          {bloggerSubItems.map(item => renderBox(item, theme.primary, item.title))}
        </View>

        {/* Other Content */}
        <Text style={styles.sectionHeader}>{translatedTexts.otherContent}</Text>
        <View style={styles.grid}>
          {otherContentItems.map(item => renderBox(item, theme.secondary, item.title))}
        </View>

        {/* Your Content Section */}
        <Text style={styles.sectionHeader}>{translatedTexts.yourContent}</Text>
        <View style={styles.grid}>

          {/* Premium Chat for subscribed users */}
          {access === '9900' && renderBox(
            {
              title: translatedTexts.premiumChat,
              icon: 'chatbubble-ellipses-outline',
              type: 'Chat' // navigates to ChatScreen
            },
            '#FFD700',
            translatedTexts.premiumChat
          )}

          {/* Subscribe button for free users */}
          {access === '0516' && renderBox(
            {
              title: translatedTexts.subscribe,
              icon: 'heart-outline',
              type: 'Subscription' // navigates to SubscriptionScreen
            },
            theme.primary,
            translatedTexts.subscribe
          )}

          {/* Profile Button */}
          {renderBox(
            {
              title: translatedTexts.ProfileScreen,
              icon: 'person-outline',
              type: 'Profile'
            },
            theme.secondary,
            translatedTexts.ProfileScreen
          )}


          {/* Logout button */}
          <TouchableOpacity
            style={{
              width: BOX_SIZE,
              height: BOX_SIZE,
              borderRadius: 16,
              marginBottom: 20,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#ef4444',
              elevation: 5
            }}
            onPress={async () => {
              await supabase.auth.signOut();
              navigation.replace('Login');
            }}
          >
            <Ionicons name="log-out-outline" size={40} color="#fff" />
            <Text style={styles.boxText}>{translatedTexts.logout}</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </LinearGradient>
  );
}
