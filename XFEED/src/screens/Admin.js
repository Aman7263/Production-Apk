import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    TextInput
} from "react-native"

import { getOrders, closeOrder } from "../service/api"
import { GlobalStyles, ThemeColors } from "../theme"

export default function Admin({ navigation }) {

    const [tab, setTab] = useState("pending")
    const [orders, setOrders] = useState([])
    const [searchText, setSearchText] = useState("")
    const [filteredOrders, setFilteredOrders] = useState([])

    useEffect(() => {
        loadOrders()
    }, [tab])

    useEffect(() => {
        handleSearch(searchText)
    }, [searchText, orders])

    const formatDate = (dateStr) => {
        if (!dateStr) return "-"
        const date = new Date(dateStr)
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        })
    }

    async function loadOrders() {
        const data = await getOrders(tab)
        setOrders(data || [])
        setFilteredOrders(data || [])
    }

    const handleCloseOrder = async (id) => {
        await closeOrder(id)
        loadOrders()
    }

    const handleSearch = (text) => {
        setSearchText(text)
        if (!text) {
            setFilteredOrders(orders)
            return
        }

        const lower = text.toLowerCase()
        const filtered = orders.filter((item) =>
            (item.user_name || "").toLowerCase().includes(lower) ||
            (item.email || "").toLowerCase().includes(lower) ||
            (item.item_name || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower)
        )
        setFilteredOrders(filtered)
    }

    return (
        <View style={GlobalStyles.container}>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by user, email, item or category"
                    placeholderTextColor={ThemeColors.textDim}
                    value={searchText}
                    onChangeText={handleSearch}
                />
            </View>

            {/* HEADER TABS */}
            <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                <View style={GlobalStyles.tabContainer}>
                    <TouchableOpacity
                        style={[GlobalStyles.tabItem, tab === "pending" && GlobalStyles.tabItemActive]}
                        onPress={() => setTab("pending")}
                    >
                        <Text style={[GlobalStyles.tabText, tab === "pending" && GlobalStyles.tabTextActive]}>
                            Pending
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GlobalStyles.tabItem, tab === "closed" && GlobalStyles.tabItemActive]}
                        onPress={() => setTab("closed")}
                    >
                        <Text style={[GlobalStyles.tabText, tab === "closed" && GlobalStyles.tabTextActive]}>
                            Closed
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ORDER LIST */}
            <FlatList
                data={filteredOrders}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <View style={[GlobalStyles.glassCard, styles.orderCard]}>

                        {/* ROW: IMAGE + DETAILS */}
                        <View style={styles.row}>

                            {/* IMAGE */}
                            <Image
                                source={{ uri: item.images?.[0] || "https://via.placeholder.com/100" }}
                                style={styles.image}
                            />

                            {/* DETAILS */}
                            <View style={styles.details}>

                                {/* USER + DATE */}
                                <Text style={styles.userName}>
                                    {item.user_name} {"\n"}Order: {formatDate(item.created_at)}
                                </Text>

                                {/* USER EMAIL */}
                                <Text style={styles.userEmail}>Email: {item.email}</Text>

                                {/* ITEM NAME */}
                                <Text style={styles.itemName}>{item.item_name}</Text>

                                {/* CATEGORY + QTY */}
                                <View style={styles.metaRow}>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.category}</Text>
                                    </View>
                                    <View style={[styles.badge, styles.qtyBadge]}>
                                        <Text style={styles.badgeText}>Qty: {item.qty}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* CLOSE ORDER BUTTON */}
                        {tab === "pending" && (
                            <TouchableOpacity
                                style={[GlobalStyles.button, GlobalStyles.dangerButton, styles.closeBtn]}
                                onPress={() => handleCloseOrder(item.id)}
                            >
                                <Text style={[GlobalStyles.buttonText, GlobalStyles.dangerButtonText]}>
                                    Close Order
                                </Text>
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

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("AddProduct")}
            >
                <Text style={styles.fabIcon}>＋</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 100
    },
    searchInput: {
        backgroundColor: ThemeColors.surfaceDark,
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 8,
        color: ThemeColors.text,
        fontSize: 14
    },
    orderCard: {
        padding: 12,
        marginBottom: 15
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start"
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: "#222"
    },
    details: {
        flex: 1,
        marginLeft: 12
    },
    userName: {
        color: ThemeColors.text,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 2
    },
    userEmail: {
        color: ThemeColors.textDim,
        fontSize: 14,
        marginBottom: 4
    },
    itemName: {
        color: ThemeColors.textDim,
        fontSize: 14,
        marginBottom: 6
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center"
    },
    badge: {
        backgroundColor: ThemeColors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginRight: 8
    },
    qtyBadge: {
        backgroundColor: ThemeColors.primary
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold"
    },
    closeBtn: {
        marginTop: 10
    },
    fab: {
        position: "absolute",
        bottom: 30,
        right: 20,
        backgroundColor: ThemeColors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center"
    },
    fabIcon: {
        color: "#fff",
        fontSize: 30
    }
})