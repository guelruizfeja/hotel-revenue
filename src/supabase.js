import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://htkpjujfgcnxxbvwbwuw.supabase.co'
const supabaseKey = 'sb_publishable_F_NkVTJOsrB9JQ4yxxT9XQ_e_T_MpEo'

export const supabase = createClient(supabaseUrl, supabaseKey)