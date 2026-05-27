import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env'

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('Missing Supabase credentials in config')
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
