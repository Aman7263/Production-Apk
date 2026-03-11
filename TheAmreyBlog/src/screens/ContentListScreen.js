import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../config/supabase';
import { useTheme } from '../Theme/useTheme';
import { createStyles } from '../Theme/createStyles';
import { Ionicons } from '@expo/vector-icons';
import { translateText } from '../config/translate';

export default function ContentListScreen({ route, navigation }) {
  const { type, heading } = route.params;
  const { theme, toggleTheme, mode } = useTheme();
  const styles = createStyles(theme);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // For filtered posts
  const [categories, setCategories] = useState([]); // For API fetched categories
  const [language, setLanguage] = useState('es');
  const [translatedHeading, setTranslatedHeading] = useState(heading || '');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 🔥 Load Data from Supabase
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const { data: fetchedData, error } = await supabase
        .from(type)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Supabase error:', error.message);
        return;
      }

      if (!fetchedData) {
        setData([]);
        setFilteredData([]);
        return;
      }

      // Translate headings
      const translatedItems = await Promise.all(
        fetchedData.map(async (item) => {
          const translatedHeading = await translateText(item.heading, language);
          return { ...item, translatedHeading };
        })
      );

      setData(translatedItems);
      setFilteredData(translatedItems); // Initially show all

      // Extract unique categories from data
      const uniqueCategories = Array.from(
        new Set(fetchedData.map((item) => item.category).filter(Boolean))
      );
      setCategories(['All', ...uniqueCategories]);

    } catch (err) {
      console.log('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, language]);

  // Reload when language changes
  useEffect(() => {
    load();
  }, [load]);

  // Translate main heading separately
  useEffect(() => {
    if (heading) {
      translateText(heading, language).then(setTranslatedHeading);
    }
  }, [heading, language]);

  // Filter posts when selectedCategory changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter((item) => item.category === selectedCategory));
    }
  }, [selectedCategory, data]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('ContentDetail', {
          item,
        })
      }
      style={{
        backgroundColor: theme.card,
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 4
      }}
    >
      {/* Category */}
      <Text style={{ fontSize: 13, color: theme.primary, fontWeight: 'bold' }}>
        {item.category}
      </Text>

      {/* Heading */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginTop: 5 }}>
        {item.translatedHeading || item.heading}
      </Text>

      {/* Created Date */}
      <Text style={{ fontSize: 13, color: theme.text, opacity: 0.6 }}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { padding: 15 }]}>
      {/* Header */}
      <View
        style={{
          marginTop: 25,
          padding: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.card,
          marginBottom: 10,
          borderRadius: 12,
          elevation: 5
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

      {/* Category Heading */}
      {heading && (
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.primary,
            marginBottom: 15,
            textAlign: 'center'
          }}
        >
          {translatedHeading || heading}
        </Text>
      )}

      {/* ✅ Category Box */}
      <View
        style={{
          marginBottom: 15,
          padding: 10,
          backgroundColor: theme.background,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.primary,
        }}
      >
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginRight: 8,
                backgroundColor: selectedCategory === cat ? theme.primary : theme.card,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: selectedCategory === cat ? theme.background : theme.primary,
                  fontWeight: 'bold',
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Loader or List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}