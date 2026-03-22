import React, { useEffect, useState } from "react"
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native"
import { GlobalStyles, ThemeColors } from "../theme"
import { supabase } from "../service/supabase"
import { getUserOrders } from "../service/api"

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState("")

    useEffect(() => {
        setupUser()
    }, [])

    async function setupUser() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
            setEmail(session.user.email)
            loadOrders(session.user.email)
        } else {
            setLoading(false)
        }
    }

    async function loadOrders(userEmail) {
        setLoading(true)
        const data = await getUserOrders(userEmail, "closed")
        if (data) {
            setOrders(data)
        }
        setLoading(false)
    }

    return (
        <View style={GlobalStyles.container}>
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={ThemeColors.primary} />
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>You have no closed orders.</Text>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.orderCard}>
                                <Text style={styles.itemName}>{item.item_name}</Text>
                                <Text style={styles.itemDetail}>Quantity: {item.qty}</Text>
                                <Text style={styles.itemDetail}>Category: {item.category}</Text>
                                <Text style={styles.itemStatusClosed}>Status: Closed</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingTop: 100,
        paddingHorizontal: 20,
    },
    orderCard: {
        backgroundColor: ThemeColors.surfaceDark,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: ThemeColors.border,
    },
    itemName: {
        color: ThemeColors.text,
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    itemDetail: {
        color: ThemeColors.textDim,
        fontSize: 14,
        marginBottom: 3,
    },
    itemStatusClosed: {
        color: ThemeColors.success || "#28a745",
        fontSize: 14,
        fontWeight: "bold",
        marginTop: 5,
    },
    emptyText: {
        color: ThemeColors.textDim,
        fontSize: 16,
        textAlign: "center",
        marginTop: 50,
    }
})
