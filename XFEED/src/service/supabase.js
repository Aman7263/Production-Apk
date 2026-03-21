import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://idcdpktbvpguwvdqqplo.supabase.co"
const SUPABASE_KEY = "sb_publishable_x4wjh4g8WoxWMWSg-GKrXw_24ALHgRF"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)