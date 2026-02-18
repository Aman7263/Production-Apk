import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')
const boxSize = (width - 60) / 2 // 2 boxes per row with padding

export default function HomeScreen({ navigation }) {
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
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.box, { backgroundColor: item.color + '20' }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '30' }]}>
              {getIcon(item.iconType, item.icon, item.color)}
            </View>
            <Text style={styles.boxText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    width: boxSize,
    height: boxSize,
    marginBottom: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    backgroundColor: 'white',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
})