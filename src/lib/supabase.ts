import { createClient } from '@supabase/supabase-js'

const environment = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
const url = environment?.VITE_SUPABASE_URL
const key = environment?.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key && !key.includes('your_project_key'))

export const supabase = isSupabaseConfigured
  ? createClient(url as string, key as string, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
