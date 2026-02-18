import { supabase } from "../config/supabase"
import { generateNews } from "../config/gemini"

export async function createDailyNews() {

  const news = await generateNews()

  const today = new Date().toISOString().split("T")[0]

  await supabase.from("news").insert({
    date: today,
    content: news
  })
}

export async function getNews() {

  const { data } = await supabase
    .from("news")
    .select("*")
    .order("date", { ascending: false })

  return data
}