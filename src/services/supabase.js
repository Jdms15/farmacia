// src/services/supabase.js - Versión segura sin Service Role Key
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente único con anon key (seguro para frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase configurado de forma segura:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  secure: true
})