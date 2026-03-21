import React from "react"
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native"
import { GlobalStyles, ThemeColors } from "../theme"

const { width } = Dimensions.get("window")

export default function ProductCard({ item, onAdd }) {

    const handleAdd = () => {
        let msg = item.return_policy === "no"
            ? "No return policy. If you add this item it cannot be removed."
            : "If you add this item it cannot be removed."

        Alert.alert("Confirm", msg, [
            { text: "Cancel", style: "cancel" },
            { text: "Add", style: "default", onPress: () => onAdd(item) }
        ])
    }

    return (
        <View style={styles.cardContainer}>
            <View style={[GlobalStyles.glassCard, styles.card]}>
                
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={2}>{item.item}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.actualPrice}>₹{item.actual_price}</Text>
                    <Text style={styles.offerPrice}>₹{item.offer_price}</Text>
                </View>
                
                <Text style={styles.stock}>Stock: {item.stock_left}</Text>

                <TouchableOpacity 
                    style={[GlobalStyles.button, styles.addButton]} 
                    activeOpacity={0.8}
                    onPress={handleAdd}
                >
                    <Text style={GlobalStyles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>

            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    cardContainer: {
        width: (width - 40) / 2, // Accounting for paddings
        marginHorizontal: 10,
        marginBottom: 20,
    },
    card: {
        padding: 15,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        minHeight: 220,
        justifyContent: 'space-between'
    },
    header: {
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: ThemeColors.text,
        marginBottom: 4,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(94, 92, 230, 0.3)', // Soft purple
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
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 5,
    },
    offerPrice: {
        fontSize: 18,
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
        marginBottom: 12,
        fontStyle: 'italic',
    },
    addButton: {
        paddingVertical: 10,
        borderRadius: 12,
    }
})