import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useTheme } from '../Theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../Theme/createStyles';
import { translateText } from '../config/translate';

export default function ContentDetailScreen({ route }) {
  const { item } = route.params;
  const { theme, toggleTheme, mode } = useTheme();
  const { width } = useWindowDimensions();

  const [language, setLanguage] = useState('es');
  const [translatedHeading, setTranslatedHeading] = useState(item.heading);
  const [translatedContent, setTranslatedContent] = useState(item.content);
  const [category, setCategory] = useState(''); // Store category
  const [contentWithoutCategory, setContentWithoutCategory] = useState(''); // Content without category

  const isReadingMode = mode === 'reading';

  useEffect(() => {
    const translateContent = async () => {
      const heading = await translateText(item.heading, language);
      const content = await translateText(item.content, language);
      setTranslatedHeading(heading);

      // Parse the content to extract the category div and remove it from the content
      const categoryDivRegex = /<div[^>]*>.*?Category:<\/strong>\s*(.*?)\s*<\/div>/;
      const match = content.match(categoryDivRegex);

      if (match) {
        // Extract category value
        setCategory(match[1] || ''); // Default to empty if undefined
      }

      // Remove category div from the content using the regex
      const contentWithoutCat = content.replace(categoryDivRegex, '').trim();
      setContentWithoutCategory(contentWithoutCat); // Set the content without the category div
    };

    translateContent();
  }, [language, item]);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        backgroundColor: theme.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          marginTop: 25,
          padding: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.card,
          marginBottom: 15,
          borderRadius: 12,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>
          TheAmrey
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'es' ? 'fr' : 'es')}
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

      {/* Content Card */}
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 20,
          elevation: 8,
        }}
      >
        {/* Heading */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.primary,
            marginBottom: 10,
          }}
        >
          {translatedHeading}
        </Text>

        {/* Category (only show the category outside the content) */}
        {category && (
          <Text
            style={{
              fontSize: 14,
              color: theme.primary,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            {category} {/* Display the extracted category */}
          </Text>
        )}

        {/* Created Date */}
        <Text
          style={{
            fontSize: 14,
            color: theme.text,
            opacity: 0.6,
            marginBottom: 15,
          }}
        >
          {new Date(item.created_at).toLocaleString()}
        </Text>

        {/* ✅ HTML CONTENT WITHOUT CATEGORY */}
        <RenderHTML
          contentWidth={width}
          source={{ html: contentWithoutCategory }}
          tagsStyles={{
            p: {
              fontSize: isReadingMode ? 18 : 16,
              lineHeight: isReadingMode ? 30 : 24,
              color: theme.text,
              marginBottom: 15,
            },
            h3: {
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.primary,
              marginTop: 20,
              marginBottom: 10,
            },
            div: {
              color: theme.text,
            },
            // Additional styling if needed for content
          }}
        />
      </View>
    </ScrollView>
  );
}
