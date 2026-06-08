import { createClient } from '@supabase/supabase-js'

// Supabase uses navigator.locks for auth token management which hangs in some
// environments. Override it before creating the client to force the no-op fallback.
try {
  Object.defineProperty(navigator, 'locks', {
    value: undefined,
    writable: true,
    configurable: true,
  })
} catch (_) {}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
