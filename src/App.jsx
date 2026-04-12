import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { migrateLocalData } from './data/storage'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import RecentView from './views/RecentView'
import RecordSheet from './views/RecordSheet'
import WorkoutSession, { useTimer } from './views/WorkoutSession'
import SearchView from './views/SearchView'
import ProfileView from './views/ProfileView'
import LoginView from './views/LoginView'

const views = {
  home: HomeView,
  recent: RecentView,
  search: SearchView,
  profile: ProfileView,
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = logged out
  const [activeView, setActiveView] = useState('home')
  const [recordOpen, setRecordOpen] = useState(false)
  const [sessionRoutine, setSessionRoutine] = useState(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [recentsKey, setRecentsKey] = useState(0)
  const timer = useTimer(!!sessionRoutine)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await migrateLocalData() // migrate any pre-auth local data
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleNavChange(view) {
    if (view === 'record') {
      if (sessionRoutine) {
        setSessionOpen(true)
      } else {
        setRecordOpen(true)
      }
    } else {
      setActiveView(view)
    }
  }

  function handleSessionStart(routine) {
    setSessionRoutine(routine)
    setSessionOpen(true)
    setRecordOpen(false)
  }

  function handleSessionClose() {
    setSessionOpen(false)
  }

  function handleSessionEnd(goToRecents = false) {
    setSessionRoutine(null)
    setSessionOpen(false)
    if (goToRecents) {
      setRecentsKey((k) => k + 1)
      setActiveView('recent')
    }
  }

  // Loading state
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-black">
        <div className="w-6 h-6 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (user === null) {
    return <LoginView />
  }

  const ActiveView = views[activeView]

  return (
    <div className="relative flex flex-col h-screen bg-brand-black text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto z-0">
        <ActiveView refreshKey={recentsKey} />
      </main>
      <BottomNav
        active={recordOpen ? 'record' : activeView}
        onChange={handleNavChange}
        sessionActive={!!sessionRoutine}
      />
      <RecordSheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSessionStart={handleSessionStart}
      />
      <WorkoutSession
        routine={sessionRoutine}
        open={sessionOpen}
        onClose={handleSessionClose}
        onFinish={(goToRecents) => handleSessionEnd(goToRecents)}
        timer={timer}
      />
    </div>
  )
}
