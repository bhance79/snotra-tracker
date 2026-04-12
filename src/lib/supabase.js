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
  'https://egkzocbacvkibevteuqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVna3pvY2JhY3ZraWJldnRldXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTQ3NDIsImV4cCI6MjA5MTQ5MDc0Mn0.6rlgz4IvZevD8am-c-CiFjQGeJ-1XKl-8eumSuwXnOE'
)
