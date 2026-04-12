import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (!email || !password) return
    setLoading(true)
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 bg-brand-black">
      <h1 className="text-3xl font-bold text-white mb-1">Snotra</h1>
      <p className="text-zinc-500 text-sm mb-10">Track your workouts</p>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        className="w-full flex flex-col"
      >
        <input
          type="email"
          name="email"
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-zinc-900 text-white rounded-2xl px-4 py-3.5 mb-3 outline-none border border-zinc-800 focus:border-zinc-600 transition-colors placeholder-zinc-600"
          style={{ fontSize: '16px' }}
        />
        <input
          type="password"
          name="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-900 text-white rounded-2xl px-4 py-3.5 mb-4 outline-none border border-zinc-800 focus:border-zinc-600 transition-colors placeholder-zinc-600"
          style={{ fontSize: '16px' }}
        />

        {error && <p className="text-brand-red text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!email || !password || loading}
          className="w-full py-4 rounded-2xl bg-brand-red text-white font-semibold text-base active:bg-brand-crimson transition-colors disabled:opacity-40 mb-4"
        >
          {loading ? '…' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={() => { setIsSignUp(!isSignUp); setError('') }}
        className="text-zinc-500 text-sm active:text-white transition-colors"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
