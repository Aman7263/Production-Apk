import React, { useEffect, useState } from "react"
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native"
import { getProducts, updateStock, createOrder } from "../service/api"
import ProductCard from "./ProductCard"
import { GlobalStyles, ThemeColors } from "../theme"

const { width } = Dimensions.get("window")

export default function Products({ route }) {

    const { table } = route.params
    const [products, setProducts] = useState([])
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        loadProducts()
    }, [offset])

    async function loadProducts() {
        const data = await getProducts(table, null, offset)
        if (data) setProducts(prev => offset === 0 ? data : [...prev, ...data])
    }

    async function addItem(item) {
        await updateStock(table, item.id, item.stock_left)
        await createOrder("user@email.com", item.id, table, "aman")
    }

    function nextPage() {
        setOffset(prev => prev + 50)
    }

    return (
        <View style={GlobalStyles.container}>
            <FlatList
                data={products}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <ProductCard item={item} onAdd={addItem} />
                )}
                ListFooterComponent={
                    <TouchableOpacity 
                        style={[GlobalStyles.button, styles.loadMoreBtn]} 
                        onPress={nextPage}
                    >
                        <Text style={GlobalStyles.buttonText}>Load More</Text>
                    </TouchableOpacity>
                }
            />
        </View>
    )

}

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 110, // Avoid header overlap
        paddingBottom: 40,
    },
    loadMoreBtn: {
        marginVertical: 20,
        marginHorizontal: 10,
        backgroundColor: ThemeColors.secondary,
    }
})