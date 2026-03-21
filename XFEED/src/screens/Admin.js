import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native"
import { getOrders, closeOrder } from "../service/api"
import { GlobalStyles, ThemeColors } from "../theme"

export default function Admin() {

    const [tab, setTab] = useState("pending")
    const [orders, setOrders] = useState([])

    useEffect(() => {
        loadOrders()
    }, [tab])

    async function loadOrders() {
        const data = await getOrders(tab)
        setOrders(data)
    }

    const handleCloseOrder = async (id) => {
        await closeOrder(id)
        loadOrders()
    }

    return (

        <View style={GlobalStyles.container}>

            <View style={{ paddingHorizontal: 20, paddingTop: 110 }}>
                <View style={GlobalStyles.tabContainer}>
                    <TouchableOpacity
                        style={[GlobalStyles.tabItem, tab === "pending" && GlobalStyles.tabItemActive]}
                        onPress={() => setTab("pending")}
                    >
                        <Text style={[GlobalStyles.tabText, tab === "pending" && GlobalStyles.tabTextActive]}>Pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GlobalStyles.tabItem, tab === "closed" && GlobalStyles.tabItemActive]}
                        onPress={() => setTab("closed")}
                    >
                        <Text style={[GlobalStyles.tabText, tab === "closed" && GlobalStyles.tabTextActive]}>Closed</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={orders}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    
                    <View style={[GlobalStyles.glassCard, styles.orderCard]}>
                        
                        <View style={styles.cardHeader}>
                            <Text style={styles.userName}>{item.user_name}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.category}</Text>
                            </View>
                        </View>

                        {tab === "pending" && (
                            <TouchableOpacity
                                style={[GlobalStyles.button, GlobalStyles.dangerButton, { marginTop: 15 }]}
                                onPress={() => handleCloseOrder(item.id)}
                            >
                                <Text style={[GlobalStyles.buttonText, GlobalStyles.dangerButtonText]}>Close Order</Text>
                            </TouchableOpacity>
                        )}

                    </View>

                )}
                ListEmptyComponent={() => (
                    <Text style={[GlobalStyles.subText, { textAlign: 'center', marginTop: 40 }]}>
                        No {tab} orders found.
                    </Text>
                )}
            />

        </View>

    )

}

const styles = StyleSheet.create({
    orderCard: {
        padding: 20,
        marginBottom: 15,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    userName: {
        color: ThemeColors.text,
        fontSize: 18,
        fontWeight: "600",
    },
    badge: {
        backgroundColor: ThemeColors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold",
    }
})