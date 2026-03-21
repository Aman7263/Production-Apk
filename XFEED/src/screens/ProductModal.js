import React, { useState } from "react"
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ScrollView,
    Alert
} from "react-native"

import { ThemeColors, GlobalStyles } from "../theme"

const { width, height } = Dimensions.get("window")

export default function ProductDetailsModal({ visible, item, onClose, onAdd }) {

    const [qty, setQty] = useState(1)

    if (!item) return null

    const increase = () => {
        if (qty < item.stock_left) setQty(qty + 1)
        else Alert.alert("Stock Limit", "No more stock available")
    }

    const decrease = () => {
        if (qty > 1) setQty(qty - 1)
    }

    // ✅ ALERT ADDED HERE
    const handleAdd = () => {

        let msg = item.return_policy === "no"
            ? "No return policy. Cannot remove later."
            : "Confirm add to cart?"

        Alert.alert("Confirm", msg, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Add",
                onPress: () => {
                    onAdd(item, qty)
                    onClose()
                    setQty(1)
                }
            }
        ])
    }

    return (
        <Modal visible={visible} animationType="slide">

            <View style={styles.container}>

                {/* CLOSE */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* 🔥 IMAGE SLIDER */}
                    <FlatList
                        data={item.images || []}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item: img }) => (
                            <Image source={{ uri: img }} style={styles.image} />
                        )}
                    />

                    {/* DETAILS */}
                    <View style={styles.content}>

                        <Text style={styles.title}>
                            {item.title || item.item}
                        </Text>

                        <Text style={styles.category}>
                            {item.category}
                        </Text>

                        <Text style={styles.description}>
                            {item.description}
                        </Text>

                        {/* PRICE */}
                        <View style={styles.priceRow}>
                            <Text style={styles.actualPrice}>
                                ₹{item.actual_price}
                            </Text>

                            <Text style={styles.offerPrice}>
                                ₹{item.offer_price}
                            </Text>
                        </View>

                        {/* STOCK */}
                        <Text style={styles.stock}>
                            Stock Available: {item.stock_left}
                        </Text>

                        {/* RETURN POLICY */}
                        <Text style={styles.returnPolicy}>
                            Return: {item.return_policy === "yes"
                                ? "Available"
                                : "Not Available"}
                        </Text>

                    </View>

                </ScrollView>

                {/* 🔥 BOTTOM BAR */}
                <View style={styles.bottomBar}>

                    {/* QTY */}
                    <View style={styles.qtyRow}>
                        <TouchableOpacity onPress={decrease} style={styles.qtyBtn}>
                            <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyNumber}>{qty}</Text>

                        <TouchableOpacity onPress={increase} style={styles.qtyBtn}>
                            <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ADD BUTTON */}
                    <TouchableOpacity
                        style={[
                            GlobalStyles.button,
                            styles.addBtn,
                            item.stock_left === 0 && { backgroundColor: "#555" }
                        ]}
                        disabled={item.stock_left === 0}
                        onPress={handleAdd}
                    >
                        <Text style={GlobalStyles.buttonText}>
                            {item.stock_left === 0
                                ? "Out of Stock"
                                : `Add ${qty} to Cart`}
                        </Text>
                    </TouchableOpacity>

                </View>

            </View>

        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 5,
        flex: 1,
        borderRadius: 10,
        backgroundColor: ThemeColors.background
    },

    closeBtn: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 8,
        borderRadius: 20
    },

    image: {
        width: width,
        height: height * 0.7,
        backgroundColor: "#111"
    },

    content: {
        padding: 20,
        paddingBottom: 120
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        color: ThemeColors.text,
        marginBottom: 6
    },

    category: {
        color: ThemeColors.secondary,
        marginBottom: 10
    },

    description: {
        color: ThemeColors.textDim,
        marginBottom: 15,
        lineHeight: 20
    },

    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10
    },

    actualPrice: {
        textDecorationLine: "line-through",
        color: ThemeColors.textDim
    },

    offerPrice: {
        fontSize: 22,
        fontWeight: "bold",
        color: ThemeColors.success,
        marginLeft: 10
    },

    stock: {
        color: ThemeColors.textDim,
        marginBottom: 6
    },

    returnPolicy: {
        color: ThemeColors.textDim
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: ThemeColors.surfaceDark,
        padding: 12,
        borderTopWidth: 1,
        borderColor: ThemeColors.border
    },

    qtyRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    qtyBtn: {
        backgroundColor: ThemeColors.surface,
        padding: 10,
        borderRadius: 10
    },

    qtyText: {
        color: "#fff",
        fontSize: 16
    },

    qtyNumber: {
        color: "#fff",
        marginHorizontal: 12,
        fontSize: 16,
        fontWeight: "600"
    },

    addBtn: {
        flex: 1,
        marginLeft: 15,
        paddingVertical: 12
    }
})