import { supabase } from "./supabase"

export async function getProducts(table, category = null, offset = 0) {

    let query = supabase
        .from(table)
        .select("*")
        .range(offset, offset + 20)

    if (category) {
        query = query.eq("category", category)
    }

    const { data, error } = await query
    return data
}

export async function updateStock(table, id, currentStock) {

    await supabase
        .from(table)
        .update({ stock_left: currentStock - 1 })
        .eq("id", id)

}

export async function createOrder(email, product_id, item_name, qty, category, user, images) {

    const { error } = await supabase
        .from("order_details")
        .insert([
            {
                email: email,
                product_id: product_id,
                category: category,
                user_name: user,
                item_name: item_name, // ✅ NEW
                qty: qty,             // ✅ NEW
                status: "pending",
                images: images
            }
        ])

    if (error) {
        console.log("Order Error:", error)
        throw error
    }
}

export async function getOrders(status) {

    const { data } = await supabase
        .from("order_details")
        .select("*")
        .eq("status", status)

    return data
}

export async function getUserOrders(email, status) {

    const { data } = await supabase
        .from("order_details")
        .select("*")
        .eq("email", email)
        .eq("status", status)

    return data
}

export async function closeOrder(id) {

    await supabase
        .from("order_details")
        .update({ status: "closed" })
        .eq("id", id)

}