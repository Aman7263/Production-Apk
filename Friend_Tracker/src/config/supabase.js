import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://cpnkdjdawteuhhwvdbcm.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_T6laHbglpVZuT9MwLvkOQQ_YmayI7SO"

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)