import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { translateText } from './translate';

export default function Header() {
  const { theme, toggleTheme, mode } = useTheme();
  const [translatedText, setTranslatedText] = useState('TheAmrey');
  const [language, setLanguage] = useState('es'); // Default language

  // Translate the text when language changes
  useEffect(() => {
    const translateHeader = async () => {
      const translated = await translateText('TheAmrey', language);
      setTranslatedText(translated);
    };
    translateHeader();
  }, [language]);

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
      <Text style={[styles.headerText, { color: theme.primary }]}>
        {translatedText}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() =>
            setLanguage(language === 'es' ? 'fr' : 'es') // Switch language
          }
          style={{ marginRight: 10 }}
        >
          <Text style={{ color: theme.primary }}>
            {language.toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons
            name={
              mode === 'light'
                ? 'moon-outline'
                : mode === 'dark'
                ? 'book-outline'
                : 'sunny-outline'
            }
            size={28}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 2,
    width: '100%',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
