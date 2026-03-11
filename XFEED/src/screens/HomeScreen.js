import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '../Theme/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GradientText from '../components/GradientText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window')
const boxSize = (width - 60) / 2 // 2 boxes per row with padding

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      title: "Live Tracking",
      icon: "location",
      iconType: "Ionicons",
      color: "#4A90E2",
      screen: "Tracking"
    },
    {
      title: "Daily News",
      icon: "newspaper",
      iconType: "MaterialCommunityIcons",
      color: "#E74C3C",
      screen: "News"
    },
    {
      title: "Chat",
      icon: "chat-bubble",
      iconType: "MaterialIcons",
      color: "#2ECC71",
      screen: "Chat"
    },
    {
      title: "Profile",
      icon: "person",
      iconType: "Ionicons",
      color: "#9B59B6",
      screen: "Profile" // Add this screen to your navigation
    },
  ]

  const getIcon = (iconType, iconName, color) => {
    const iconProps = { name: iconName, size: 40, color: color }
    
    switch(iconType) {
      case 'Ionicons':
        return <Ionicons {...iconProps} />
      case 'MaterialIcons':
        return <MaterialIcons {...iconProps} />
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...iconProps} />
      default:
        return <Ionicons {...iconProps} />
    }
  }

  return (
    <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.container}>
      <View style={{ paddingTop: insets.top + 60, paddingBottom: 20 }}>
        <GradientText style={styles.header}>Dashboard</GradientText>
      </View>
      
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{ width: boxSize, marginBottom: 20 }}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <GlassCard style={styles.box} intensity={30} tint="light">
              <View style={[styles.iconContainer, { backgroundColor: item.color + '40' }]}>
                {getIcon(item.iconType, item.icon, item.color)}
              </View>
              <Text style={[styles.boxText, { color: theme.text }]}>{item.title}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    height: boxSize,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  boxText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})