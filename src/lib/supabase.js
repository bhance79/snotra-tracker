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

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
