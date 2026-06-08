import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getDisplayName(user) {
  if (!user) return ''
  const name = user.email?.split('@')[0] ?? ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function HomeView() {
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user ?? null
      setUser(u)
      if (u) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', u.id)
          .maybeSingle()
        setDisplayName(profile?.display_name ?? '')
      }
    })
  }, [])

  const name = displayName || getDisplayName(user)

  return (
    <div className="flex flex-col h-full min-h-full">
      {/* Sticky logo header */}
      <div className="sticky top-0 bg-brand-black flex justify-center items-center px-4 py-4 safe-top z-10">
        <img src="/images/snotra-logo.png" alt="Snotra" className="h-20 w-auto" />
      </div>

      <div className="flex flex-col px-4 pb-8">
        <div className="text-center mb-6">
          <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white font-baskerville">{name}</h1>
        </div>
      </div>
    </div>
  )
}
