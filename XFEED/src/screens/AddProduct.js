import React, { useState } from "react"
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image
} from "react-native"

import { GlobalStyles, ThemeColors } from "../theme"
import * as ImagePicker from 'expo-image-picker'
import { supabase } from "../service/supabase"

const PRODUCT_TYPES = [
    { title: "Clothes", table: "cloths", icon: "👕" },
    { title: "Essential", table: "daily_essential", icon: "🧴" },
    { title: "Grocery", table: "grocery", icon: "🛒" },
]

export default function AddProduct({ navigation }) {

    const [selectedType, setSelectedType] = useState(PRODUCT_TYPES[0])
    const [uploadStatus, setUploadStatus] = useState([])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        item: "",
        category: "",
        description: "",
        actual_price: "",
        offer_price: "",
        stock_left: "",
        return_policy: "yes"
    })

    // 🔥 PICK + AUTO UPLOAD
    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 1,
        })

        if (!result.canceled) {
            const startIndex = uploadStatus.length

            const newImages = result.assets.map(a => ({
                uri: a.uri,
                status: "uploading",
                progress: 10,
                url: null
            }))

            setUploadStatus(prev => [...prev, ...newImages])

            newImages.forEach((img, i) => {
                uploadSingleImage(img, startIndex + i)
            })
        }
    }

    // 🔥 UPLOAD ONE IMAGE
    const uploadSingleImage = async (img, index) => {
        try {
            updateStatus(index, "uploading", 30)

            const response = await fetch(img.uri)
            const arrayBuffer = await response.arrayBuffer()

            updateStatus(index, "uploading", 70)

            const fileName = `${Date.now()}_${Math.random()}.jpg`

            const { data, error } = await supabase.storage
                .from("products")
                .upload(`public/${fileName}`, arrayBuffer, {
                    contentType: "image/jpeg"
                })

            if (error) throw error

            const { data: publicUrl } = supabase.storage
                .from("products")
                .getPublicUrl(data.path)

            setUploadStatus(prev => {
                const updated = [...prev]
                updated[index] = {
                    ...updated[index],
                    status: "done",
                    progress: 100,
                    url: publicUrl.publicUrl
                }
                return updated
            })

        } catch (err) {
            updateStatus(index, "error", 100)
        }
    }

    // 🔥 UPDATE STATUS
    const updateStatus = (index, status, progress) => {
        setUploadStatus(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], status, progress }
            return updated
        })
    }

    // ❌ REMOVE IMAGE
    const removeImage = (index) => {
        setUploadStatus(prev => prev.filter((_, i) => i !== index))
    }

    // ✅ SUBMIT
    const handleSubmit = async () => {
        try {

            if (loading) return // 🚫 prevent double click

            if (!form.item || !form.category || !form.actual_price) {
                alert("Fill required fields")
                return
            }

            setLoading(true) // 🔥 START LOADING

            const uploadedImages = uploadStatus
                .filter(img => img.status === "done")
                .map(img => img.url)

            if (uploadedImages.length === 0) {
                alert("Upload at least one image")
                setLoading(false)
                return
            }

            const payload = {
                item: form.item,
                category: form.category,
                description: form.description,
                actual_price: parseFloat(form.actual_price),
                offer_price: parseFloat(form.offer_price),
                stock_left: parseInt(form.stock_left),
                return_policy: form.return_policy,
                images: uploadedImages
            }

            const { error } = await supabase
                .from(selectedType.table)
                .insert([payload])

            if (error) throw error

            alert("Product Added ✅")
            navigation.goBack()

        } catch (err) {
            console.log(err)
            alert(err.message)
        } finally {
            setLoading(false) // 🔥 STOP LOADING ALWAYS
        }
    }

    return (
        <View style={GlobalStyles.container}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >

                {/* TYPE */}
                <View style={styles.section}>
                    <Text style={styles.label}>Select Type</Text>
                    <View style={styles.row}>
                        {PRODUCT_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item.table}
                                style={[
                                    styles.typeCard,
                                    selectedType.table === item.table && styles.typeCardActive
                                ]}
                                onPress={() => setSelectedType(item)}
                            >
                                <Text style={styles.typeIcon}>{item.icon}</Text>
                                <Text style={styles.typeText}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* FORM */}
                <View style={styles.section}>
                    {Object.keys(form)
                        .filter(key => key !== "return_policy")
                        .map((key) => (
                            <View key={key} style={{ marginBottom: 12 }}>
                                <Text style={styles.label}>{key.replace("_", " ")}</Text>
                                <TextInput
                                    value={form[key]}
                                    onChangeText={(text) =>
                                        setForm({ ...form, [key]: text })
                                    }
                                    style={styles.input}
                                    placeholder={`Enter ${key}`}
                                    placeholderTextColor={ThemeColors.textDim}
                                    keyboardType={
                                        key.includes("price") || key.includes("stock")
                                            ? "numeric"
                                            : "default"
                                    }
                                />
                            </View>
                        ))}
                </View>

                {/* RETURN POLICY */}
                <View style={styles.section}>
                    <Text style={styles.label}>Return Policy</Text>
                    <View style={styles.row}>
                        {["yes", "no"].map((val) => (
                            <TouchableOpacity
                                key={val}
                                style={[
                                    styles.typeCard,
                                    form.return_policy === val && styles.typeCardActive
                                ]}
                                onPress={() =>
                                    setForm({ ...form, return_policy: val })
                                }
                            >
                                <Text style={styles.typeText}>{val.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* PICK BUTTON */}
                <TouchableOpacity style={styles.imageBtn} onPress={pickImages}>
                    <Text style={styles.imageBtnText}>
                        📸 Select Images ({uploadStatus.length})
                    </Text>
                </TouchableOpacity>

                {/* IMAGE GRID */}
                <View style={styles.imageGrid}>
                    {uploadStatus.map((img, index) => (
                        <View key={index} style={styles.imageBox}>

                            <Image source={{ uri: img.uri }} style={styles.image} />

                            {img.status === "uploading" && (
                                <View style={styles.blurOverlay}>
                                    <Text style={{ color: "#fff" }}>
                                        {img.progress}%
                                    </Text>
                                </View>
                            )}

                            {img.status === "error" && (
                                <View style={styles.errorOverlay}>
                                    <Text style={{ color: "red" }}>Failed</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => removeImage(index)}
                            >
                                <Text style={{ color: "#fff" }}>✕</Text>
                            </TouchableOpacity>

                        </View>
                    ))}
                </View>

                {/* SUBMIT */}
                <TouchableOpacity
                    style={[
                        styles.submit,
                        loading && { opacity: 0.6 } // fade effect
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>
                        {loading ? "Adding..." : "Add Product"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 70,
        padding: 20,
        paddingBottom: 120
    },
    section: {
        marginBottom: 20
    },
    label: {
        color: ThemeColors.textDim,
        marginBottom: 6,
        fontSize: 13
    },
    row: {
        flexDirection: "row"
    },
    typeCard: {
        flex: 1,
        marginRight: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: ThemeColors.surfaceDark,
        alignItems: "center",
        borderWidth: 1,
        borderColor: ThemeColors.border
    },
    typeCardActive: {
        backgroundColor: ThemeColors.primary,
        borderColor: ThemeColors.primary
    },
    typeIcon: {
        fontSize: 20
    },
    typeText: {
        color: "#fff",
        fontSize: 12
    },
    input: {
        backgroundColor: ThemeColors.surfaceDark,
        borderRadius: 12,
        padding: 14,
        color: ThemeColors.text,
        borderWidth: 1,
        borderColor: ThemeColors.border
    },
    imageBtn: {
        backgroundColor: ThemeColors.surface,
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10
    },
    imageBtnText: {
        color: ThemeColors.text
    },
    submit: {
        backgroundColor: ThemeColors.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 20
    },
    submitText: {
        color: "#fff",
        fontSize: 16
    },

    // 🔥 IMAGE GRID
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 15
    },
    imageBox: {
        width: "48%",
        height: 120,
        margin: "1%",
        borderRadius: 12,
        overflow: "hidden"
    },
    image: {
        width: "100%",
        height: "100%"
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center"
    },
    removeBtn: {
        position: "absolute",
        top: 6,
        right: 6,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        paddingHorizontal: 6
    }
})