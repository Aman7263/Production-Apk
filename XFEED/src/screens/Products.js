import React, { useEffect, useState } from "react"
import {
    View,
    FlatList,
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    TextInput,
    Alert
} from "react-native"

import { getProducts, updateStock, createOrder } from "../service/api"
import ProductCard from "./ProductCard"
import { GlobalStyles, ThemeColors } from "../theme"
import { supabase } from "../service/supabase"

const { width } = Dimensions.get("window")

export default function Products({ route }) {

    const { table } = route.params

    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])

    const [offset, setOffset] = useState(0)

    // NEW STATES
    const [search, setSearch] = useState("")
    const [sortOrder, setSortOrder] = useState(null) // "low" | "high"
    const [category, setCategory] = useState(null)
    const [role, setRole] = useState("0512")

    useEffect(() => {
        fetchRole()
        loadProducts()
    }, [offset])

    async function fetchRole() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
            const { data } = await supabase
                .from("user_roles")
                .select("role_id")
                .eq("email", session.user.email)
                .single()
            if (data?.role_id) {
                setRole(data.role_id)
            }
        }
    }

    useEffect(() => {
        applyFilters()
    }, [search, sortOrder, category, products])

    async function loadProducts() {
        const data = await getProducts(table, null, offset)
        if (data) {
            setProducts(prev => offset === 0 ? data : [...prev, ...data])
        }
    }

    function applyFilters() {
        let data = [...products]

        // 🔍 SEARCH (title / item)
        if (search) {
            data = data.filter(item =>
                (item.title || item.item)
                    ?.toLowerCase()
                    .includes(search.toLowerCase())
            )
        }

        // 🏷 CATEGORY FILTER
        if (category) {
            data = data.filter(item => item.category === category)
        }

        // 🔽 SORT
        if (sortOrder === "low") {
            data.sort((a, b) => a.offer_price - b.offer_price)
        } else if (sortOrder === "high") {
            data.sort((a, b) => b.offer_price - a.offer_price)
        }

        setFilteredProducts(data)
    }

    async function addItem(item, qty) {
        await updateStock(table, item.id, item.stock_left - qty)

        setProducts(prev =>
            prev.map(p =>
                p.id === item.id
                    ? { ...p, stock_left: p.stock_left - qty }
                    : p
            )
        )

        const { data: { session } } = await supabase.auth.getSession()
        const userEmail = session?.user?.email || "user@email.com"

        // for (let i = 0; i < qty; i++) {
        await createOrder(userEmail, item.id, item.item, qty, table, "aman", item.images)
        // }

        // 🔥 RELOAD LIST
        setOffset(0)
        setProducts([])
        loadProducts()
    }

    async function markOutOfStock(item) {
        Alert.alert("Confirm", "Mark this item out of stock? It will close it.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes",
                onPress: async () => {
                    await updateStock(table, item.id, 0)
                    setOffset(0)
                    setProducts([])
                    loadProducts()
                }
            }
        ])
    }

    function nextPage() {
        setOffset(prev => prev + 10)
    }

    // get unique categories
    const categories = [...new Set(products.map(p => p.category))]

    return (
        <View style={GlobalStyles.container}>

            {/* 🔥 HEADER */}
            <View style={styles.header}>

                {/* SORT */}
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() =>
                        setSortOrder(prev =>
                            prev === "low" ? "high" : "low"
                        )
                    }
                >
                    <Text style={styles.headerText}>
                        {sortOrder === "low" ? "₹ ↑" : "₹ ↓"}
                    </Text>
                </TouchableOpacity>

                {/* SEARCH */}
                <TextInput
                    placeholder="Search..."
                    placeholderTextColor={ThemeColors.textDim}
                    value={search}
                    onChangeText={setSearch}
                    style={styles.search}
                />

                {/* CATEGORY */}
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => {
                        const currentIndex = categories.indexOf(category)
                        const next = categories[currentIndex + 1] || null
                        setCategory(next)
                    }}
                >
                    <Text style={styles.headerText}>
                        {category || "All"}
                    </Text>
                </TouchableOpacity>

            </View>

            {/* LIST */}
            <FlatList
                data={filteredProducts}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <ProductCard 
                        item={item} 
                        onAdd={addItem} 
                        isAdmin={role === "1618"}
                        onMarkOutOfStock={markOutOfStock}
                    />
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

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 100,
        marginBottom: 10,
        gap: 8
    },

    headerBtn: {
        padding: 10,
        backgroundColor: ThemeColors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: ThemeColors.border
    },

    headerText: {
        color: ThemeColors.text,
        fontSize: 12
    },

    search: {
        flex: 1,
        backgroundColor: ThemeColors.surfaceDark,
        borderRadius: 10,
        paddingHorizontal: 12,
        color: ThemeColors.text,
        borderWidth: 1,
        borderColor: ThemeColors.border
    },

    listContainer: {
        paddingHorizontal: 10,
        paddingBottom: 40,
    },

    loadMoreBtn: {
        marginVertical: 20,
        marginHorizontal: 10,
        backgroundColor: ThemeColors.secondary,
    }
})