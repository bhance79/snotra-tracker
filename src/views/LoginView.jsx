import { useState } from 'react'
import { supabase } from '../lib/supabase'

function isEmail(value) {
  return value.includes('@')
}

export default function LoginView() {
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [usernameSignUp, setUsernameSignUp] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function resolveEmail(value) {
    if (isEmail(value)) return { email: value, error: null }
    // Look up email by username in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', value.trim())
      .maybeSingle()
    if (error) return { email: null, error: error.message }
    if (!data?.email) return { email: null, error: 'No account found for that username' }
    return { email: data.email, error: null }
  }

  async function handleSubmit() {
    setError('')
    const id = identifier.trim()
    if (!id || !password) return

    setLoading(true)

    if (isSignUp) {
      const uname = usernameSignUp.trim()
      if (!isEmail(id)) { setError('Please enter your email to sign up'); setLoading(false); return }
      if (uname && !/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
        setError('Username must be 3–20 characters: letters, numbers, underscores only')
        setLoading(false)
        return
      }

      const { data, error: signUpErr } = await supabase.auth.signUp({ email: id, password })
      if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

      // Save username + email to profile if provided
      if (uname && data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: uname,
          email: id,
          updated_at: new Date().toISOString(),
        })
      }
    } else {
      const { email, error: lookupErr } = await resolveEmail(id)
      if (lookupErr) { setError(lookupErr); setLoading(false); return }

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setError(signInErr.message); setLoading(false); return }
    }

    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  function switchMode() {
    setIsSignUp((v) => !v)
    setError('')
    setUsernameSignUp('')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 bg-brand-black">
      <img src="/images/snotra-logo.png" alt="Snotra" className="h-16 w-auto mb-1" />
      <p className="text-zinc-500 text-sm mb-10">Track your workouts</p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="w-full flex flex-col">
        <input
          type={isSignUp ? 'email' : 'text'}
          name={isSignUp ? 'email' : 'identifier'}
          inputMode={isSignUp || isEmail(identifier) ? 'email' : 'text'}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete={isSignUp ? 'email' : 'username email'}
          placeholder={isSignUp ? 'Email' : 'Email or username'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-brand-black text-white rounded-2xl px-4 py-3.5 mb-3 outline-none border border-zinc-800 focus:border-zinc-600 transition-colors placeholder-zinc-600"
          style={{ fontSize: '16px' }}
        />

        {isSignUp && (
          <input
            type="text"
            name="username"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="username"
            placeholder="Username (optional)"
            value={usernameSignUp}
            onChange={(e) => setUsernameSignUp(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-brand-black text-white rounded-2xl px-4 py-3.5 mb-3 outline-none border border-zinc-800 focus:border-zinc-600 transition-colors placeholder-zinc-600"
            style={{ fontSize: '16px' }}
          />
        )}

        <input
          type="password"
          name="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-brand-black text-white rounded-2xl px-4 py-3.5 mb-4 outline-none border border-zinc-800 focus:border-zinc-600 transition-colors placeholder-zinc-600"
          style={{ fontSize: '16px' }}
        />

        {error && <p className="text-white text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!identifier || !password || loading}
          className="w-full py-4 rounded-2xl bg-white text-zinc-900 font-semibold text-base active:bg-zinc-200 transition-colors disabled:opacity-40 mb-4"
        >
          {loading ? '…' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={switchMode}
        className="text-zinc-500 text-sm active:text-white transition-colors"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
