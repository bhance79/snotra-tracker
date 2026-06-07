import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfileView() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()

      setDisplayName(data?.display_name ?? '')
      setLoading(false)
    }
    load()
  }, [])

  function startEditing() {
    setDraft(displayName)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setDraft('')
  }

  async function saveDisplayName() {
    const trimmed = draft.trim()
    if (trimmed === displayName) { cancelEditing(); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: trimmed || null, updated_at: new Date().toISOString() })
    setDisplayName(trimmed)
    setSaving(false)
    setEditing(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full min-h-full px-6 safe-top pb-8">
      <h1 className="text-2xl font-bold text-white py-4 text-center font-baskerville">Profile</h1>

      <div className="flex flex-col gap-4 mt-2">
        {/* Display name */}
        <div className="bg-brand-card border border-white/10 rounded-2xl px-4 py-4">
          <p className="text-zinc-500 text-xs mb-1">Display name</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') cancelEditing() }}
                placeholder="Enter your name"
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-zinc-600"
              />
              <button
                onClick={cancelEditing}
                className="text-zinc-500 text-sm active:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDisplayName}
                disabled={saving}
                className="text-brand-red font-semibold text-sm active:opacity-60 transition-opacity"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`text-base ${loading ? 'text-zinc-600' : displayName ? 'text-white' : 'text-zinc-500'}`}>
                {loading ? 'Loading…' : displayName || 'No name set'}
              </span>
              <button
                onClick={startEditing}
                className="text-brand-red text-sm font-semibold active:opacity-60 transition-opacity"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email — read only */}
        <div className="bg-brand-card border border-white/10 rounded-2xl px-4 py-4">
          <p className="text-zinc-500 text-xs mb-1">Email</p>
          <span className="text-white text-base">{email}</span>
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="w-full py-3 text-brand-red font-semibold text-base active:opacity-60 transition-opacity"
      >
        Log Out
      </button>
    </div>
  )
}
