import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getDisplayName(user) {
  if (!user) return ''
  const email = user.email ?? ''
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function HomeView() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  const name = getDisplayName(user)

  return (
    <div className="flex flex-col h-full min-h-full">
      {/* Sticky logo header */}
      <div className="sticky top-0 bg-brand-black flex justify-center items-center px-4 py-4 safe-top">
        <img src="/images/snotra-logo.png" alt="Snotra" className="h-20 w-auto" />
      </div>

      {/* Welcome content */}
      <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-white">{name}</h1>
      </div>
    </div>
  )
}
