import React, { useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native"
import { GlobalStyles, ThemeColors } from "../theme"
import { supabase } from "../service/supabase"

const { width } = Dimensions.get("window")

export default function Dashboard({ navigation }) {

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => {
                    Alert.alert(
                        "Logout",
                        "Are you sure you want to log out?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Logout", onPress: () => supabase.auth.signOut(), style: "destructive" }
                        ]
                    );
                }}>
                    <Text style={{ color: ThemeColors.danger, fontWeight: '600', marginRight: 15 }}>Logout</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    const data = [
        { title: "Clothes", table: "cloths", icon: "👕" },
        { title: "Essential", table: "daily_essential", icon: "🧴" },
        { title: "Grocery", table: "grocery", icon: "🛒" },
        { title: "More", table: "more", icon: "✨" }
    ]

    return (

        <View style={GlobalStyles.container}>

            <View style={styles.gridContainer}>
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.cardWrapper}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("Products", { table: item.table })}
                    >
                        <View style={[GlobalStyles.glassCard, styles.card]}>
                            <Text style={styles.icon}>{item.icon}</Text>
                            <Text style={styles.text}>{item.title}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.adminWrapper}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Admin")}
            >
                <View style={[GlobalStyles.glassCard, styles.admin]}>
                    <Text style={styles.adminText}>ADMIN PORTAL</Text>
                </View>
            </TouchableOpacity>

        </View>

    )

}

const styles = StyleSheet.create({

    gridContainer: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 120, // Account for transparent header
    },

    cardWrapper: {
        width: (width - 60) / 2, // 2 columns with spacing
        marginBottom: 20,
    },

    card: {
        height: 140,
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    
    icon: {
        fontSize: 40,
        marginBottom: 10,
    },

    text: {
        fontSize: 16,
        fontWeight: "600",
        color: ThemeColors.text,
        letterSpacing: 0.5,
    },

    adminWrapper: {
        position: "absolute",
        bottom: 50,
        alignSelf: "center",
        width: "60%",
    },

    admin: {
        paddingVertical: 15,
        borderRadius: 20,
        alignItems: "center",
        backgroundColor: "rgba(10, 132, 255, 0.2)",
        borderWidth: 1,
        borderColor: ThemeColors.primary,
        overflow: "hidden", // Required for Android border radius on GlassView
    },
    
    adminText: {
        color: ThemeColors.text,
        fontWeight: "bold",
        fontSize: 16,
        letterSpacing: 1,
    }

})