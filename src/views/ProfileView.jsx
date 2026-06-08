import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function EditableRow({ label, value, loading, onSave, validate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function start() { setDraft(value); setEditing(true); setError('') }
  function cancel() { setEditing(false); setDraft(''); setError('') }

  async function save() {
    const trimmed = draft.trim()
    if (trimmed === value) { cancel(); return }
    if (validate) {
      const err = validate(trimmed)
      if (err) { setError(err); return }
    }
    setSaving(true)
    const err = await onSave(trimmed)
    setSaving(false)
    if (err) { setError(err); return }
    setEditing(false)
    setDraft('')
    setError('')
  }

  return (
    <div className="bg-card border border-white/10 rounded-2xl px-4 py-4">
      <p className="text-zinc-500 text-xs mb-1">{label}</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-zinc-600"
              style={{ fontSize: '16px' }}
            />
            <button onClick={cancel} className="text-zinc-500 text-sm active:text-white transition-colors">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white font-semibold text-sm active:opacity-60 transition-opacity">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {error && <p className="text-white text-xs">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-base ${loading ? 'text-zinc-600' : value ? 'text-white' : 'text-zinc-500'}`}>
            {loading ? 'Loading…' : value || 'Not set'}
          </span>
          <button onClick={start} className="text-zinc-400 text-sm font-semibold active:text-white transition-colors">
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

function PasswordRow({ email }) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function cancel() {
    setEditing(false); setCurrent(''); setNext(''); setConfirm(''); setError(''); setSuccess(false)
  }

  async function save() {
    if (next.length < 8) { setError('New password must be at least 8 characters'); return }
    if (next !== confirm) { setError('Passwords do not match'); return }
    setSaving(true); setError('')
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current })
    if (signInErr) { setSaving(false); setError('Current password is incorrect'); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    setSaving(false)
    if (updateErr) { setError(updateErr.message); return }
    setSuccess(true)
    setTimeout(cancel, 1500)
  }

  return (
    <div className="bg-card border border-white/10 rounded-2xl px-4 py-4">
      <p className="text-zinc-500 text-xs mb-1">Password</p>
      {editing ? (
        <div className="flex flex-col gap-3">
          {['Current password', 'New password', 'Confirm new password'].map((placeholder, i) => {
            const val = [current, next, confirm][i]
            const setter = [setCurrent, setNext, setConfirm][i]
            return (
              <input
                key={placeholder}
                type="password"
                autoFocus={i === 0}
                value={val}
                onChange={(e) => { setter(e.target.value); setError('') }}
                placeholder={placeholder}
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-zinc-600 border-b border-white/10 pb-2"
                style={{ fontSize: '16px' }}
              />
            )
          })}
          {error && <p className="text-brand-red text-xs">{error}</p>}
          {success && <p className="text-brand-green text-xs">Password updated</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={cancel} className="text-zinc-500 text-sm active:text-white transition-colors">Cancel</button>
            <button onClick={save} disabled={saving} className="text-white font-semibold text-sm active:opacity-60 transition-opacity">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-base">••••••••</span>
          <button onClick={() => setEditing(true)} className="text-zinc-400 text-sm font-semibold active:text-white transition-colors">
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProfileView() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .maybeSingle()

      setDisplayName(data?.display_name ?? '')
      setUsername(data?.username ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function saveDisplayName(trimmed) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: trimmed || null, updated_at: new Date().toISOString() })
    if (error) return error.message
    setDisplayName(trimmed)
    return null
  }

  async function saveUsername(trimmed) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      return 'Username must be 3–20 characters: letters, numbers, underscores only'
    }
    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle()
    const { data: { user } } = await supabase.auth.getUser()
    if (existing && existing.id !== user.id) return 'Username already taken'

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: trimmed, email: user.email, updated_at: new Date().toISOString() })
    if (error) return error.message
    setUsername(trimmed)
    return null
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full min-h-full px-6 safe-top pb-8">
      <h1 className="text-2xl font-bold text-white py-4 text-center font-baskerville">Profile</h1>

      <div className="flex flex-col gap-4 mt-2">
        <EditableRow
          label="Display name"
          value={displayName}
          loading={loading}
          onSave={saveDisplayName}
        />

        <EditableRow
          label="Username"
          value={username}
          loading={loading}
          onSave={saveUsername}
          validate={(v) => {
            if (!v) return null
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(v))
              return '3–20 characters: letters, numbers, underscores only'
            return null
          }}
        />

        {/* Email — read only */}
        <div className="bg-card border border-white/10 rounded-2xl px-4 py-4">
          <p className="text-zinc-500 text-xs mb-1">Email</p>
          <span className="text-white text-base">{email}</span>
        </div>

        <PasswordRow email={email} />
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
