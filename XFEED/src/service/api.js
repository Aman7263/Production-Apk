import { supabase } from "./supabase"

export async function getProducts(table, category = null, offset = 0) {

    let query = supabase
        .from(table)
        .select("*")
        .range(offset, offset + 49)

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

export async function createOrder(email, product_id, category, user) {

    await supabase
        .from("order_details")
        .insert([
            {
                email: email,
                product_id: product_id,
                category: category,
                user_name: user,
                status: "pending"
            }
        ])

}

export async function getOrders(status) {

    const { data } = await supabase
        .from("order_details")
        .select("*")
        .eq("status", status)

    return data
}

export async function closeOrder(id) {

    await supabase
        .from("order_details")
        .update({ status: "closed" })
        .eq("id", id)

}