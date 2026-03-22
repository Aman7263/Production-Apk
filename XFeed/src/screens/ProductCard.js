import React, { useState } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Dimensions,
    Image
} from "react-native"

import { GlobalStyles, ThemeColors } from "../theme"
import ProductDetailsModal from "./ProductModal"

const { width } = Dimensions.get("window")

export default function ProductCard({ item, onAdd, isAdmin, onMarkOutOfStock }) {

    const [open, setOpen] = useState(false)
    const [qty, setQty] = useState(1)

    const isOutOfStock = item.stock_left <= 0

    const increase = () => {
        if (qty < item.stock_left) setQty(qty + 1)
        else alert(
            `Only ${item.stock_left} item(s) available.\nYou cannot add more than available stock.`
        )
    }

    const decrease = () => {
        if (qty > 1) setQty(qty - 1)
    }

    const handleAdd = () => {
        let msg = item.return_policy === "no"
            ? "No return policy. Cannot remove later."
            : "Confirm add to cart?"

        Alert.alert("Confirm", msg, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Add",
                onPress: () => onAdd(item, qty || 1)
            }
        ])

        setQty(1)
    }

    return (
        <View style={styles.cardContainer}>

            {/* 🔥 FULL CARD */}
            <TouchableOpacity
                activeOpacity={isOutOfStock ? 1 : 0.9}
                disabled={isOutOfStock}
                onPress={() => setOpen(true)}
                style={[
                    GlobalStyles.glassCard,
                    styles.card,
                    isOutOfStock && styles.disabledCard
                ]}
            >

                {/* IMAGE */}
                <Image
                    source={{
                        uri: item.images?.[0] || "https://via.placeholder.com/150"
                    }}
                    style={styles.image}
                    resizeMode="cover"
                />

                {/* 🔥 OUT OF STOCK OVERLAY */}
                {isOutOfStock && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayText}>Out of Stock</Text>
                    </View>
                )}

                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title || item.item}
                    </Text>

                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {item.category}
                        </Text>
                    </View>
                </View>

                {/* DESCRIPTION */}
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                {/* PRICE */}
                <View style={styles.priceContainer}>
                    <Text style={styles.actualPrice}>
                        ₹{item.actual_price}
                    </Text>

                    <Text style={styles.offerPrice}>
                        ₹{item.offer_price}
                    </Text>
                </View>

                {/* STOCK */}
                <Text style={styles.stock}>
                    Stock: {item.stock_left}
                </Text>

                {/* 🔥 QUANTITY + ADD */}
                <View style={styles.bottomRow}>

                    {/* QTY */}
                    <View style={styles.qtyRow}>
                        <TouchableOpacity
                            disabled={isOutOfStock}
                            onPress={(e) => {
                                e.stopPropagation()
                                decrease()
                            }}
                            style={styles.qtyBtn}
                        >
                            <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyNumber}>{qty}</Text>

                        <TouchableOpacity
                            disabled={isOutOfStock}
                            onPress={(e) => {
                                e.stopPropagation()
                                increase()
                            }}
                            style={styles.qtyBtn}
                        >
                            <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ADD BUTTON */}
                    <TouchableOpacity
                        disabled={isOutOfStock}
                        style={[
                            GlobalStyles.button,
                            styles.addBtn,
                            isOutOfStock && styles.disabledBtn
                        ]}
                        activeOpacity={0.8}
                        onPress={(e) => {
                            e.stopPropagation()
                            handleAdd()
                        }}
                    >
                        <Text style={GlobalStyles.buttonText}>
                            {isOutOfStock ? "Out of Stock" : "Add"}
                        </Text>
                    </TouchableOpacity>

                </View>

                {isAdmin && !isOutOfStock && (
                    <TouchableOpacity
                        style={styles.adminCloseBtn}
                        onPress={(e) => {
                            e.stopPropagation()
                            onMarkOutOfStock(item)
                        }}
                    >
                        <Text style={styles.adminCloseText}>Close Product</Text>
                    </TouchableOpacity>
                )}

            </TouchableOpacity>

            {/* 🔥 MODAL */}
            <ProductDetailsModal
                visible={open}
                item={item}
                onClose={() => setOpen(false)}
                onAdd={onAdd}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        width: (width - 40) / 2,
        marginHorizontal: 10,
        marginBottom: 20,
    },

    card: {
        padding: 12,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        minHeight: 280,
        justifyContent: 'space-between'
    },

    disabledCard: {
        opacity: 0.4
    },

    image: {
        width: "100%",
        height: 120,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: "#222"
    },

    overlay: {
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        justifyContent: "center",
        alignItems: "center"
    },

    overlayText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8
    },

    header: {
        marginBottom: 6,
    },

    title: {
        fontSize: 15,
        fontWeight: "700",
        color: ThemeColors.text,
        marginBottom: 4,
    },

    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(94, 92, 230, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: ThemeColors.secondary,
    },

    badgeText: {
        color: ThemeColors.textDim,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },

    description: {
        fontSize: 12,
        color: ThemeColors.textDim,
        marginBottom: 8,
    },

    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    offerPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: ThemeColors.success,
        marginLeft: 6,
    },

    actualPrice: {
        fontSize: 12,
        color: ThemeColors.textDim,
        textDecorationLine: 'line-through',
    },

    stock: {
        fontSize: 11,
        color: ThemeColors.textDim,
        marginBottom: 10,
        fontStyle: 'italic',
    },

    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },

    qtyRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    qtyBtn: {
        backgroundColor: ThemeColors.surface,
        padding: 6,
        borderRadius: 8
    },

    qtyText: {
        color: "#fff",
        fontSize: 14
    },

    qtyNumber: {
        color: "#fff",
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: "600"
    },

    addBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10
    },

    disabledBtn: {
        backgroundColor: "#ff0000ff"
    },

    adminCloseBtn: {
        marginTop: 10,
        backgroundColor: "rgba(255, 59, 48, 0.2)",
        borderWidth: 1,
        borderColor: ThemeColors.danger || "#ff3b30",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center"
    },

    adminCloseText: {
        color: ThemeColors.danger || "#ff3b30",
        fontSize: 12,
        fontWeight: "bold"
    }
})