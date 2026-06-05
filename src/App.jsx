import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { migrateLocalData, getActiveSession, clearActiveSession } from './data/storage'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import RecentView from './views/RecentView'
import RecordView from './views/RecordView'
import WorkoutSession, { useTimer, clearSavedSession, TIMER_KEY } from './views/WorkoutSession'
import SearchView from './views/SearchView'
import ProfileView from './views/ProfileView'
import LoginView from './views/LoginView'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [activeView, setActiveView] = useState('home')
  const [sessionRoutine, setSessionRoutine] = useState(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [recentsKey, setRecentsKey] = useState(0)
  const timer = useTimer(!!sessionRoutine)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await migrateLocalData()
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    async function restore() {
      try {
        let saved = JSON.parse(localStorage.getItem('snotra_session') ?? 'null')
        if (!saved?.routine) {
          const remote = await getActiveSession()
          if (remote?.routine) {
            if (remote.startedAt) {
              localStorage.setItem(TIMER_KEY, remote.startedAt)
            }
            localStorage.setItem('snotra_session', JSON.stringify(remote))
            saved = remote
          }
        }
        if (saved?.routine) {
          setSessionRoutine(saved.routine)
          setSessionOpen(true)
        }
      } catch (_) {}
    }
    restore()
  }, [user])

  function handleNavChange(view) {
    if (view === 'record' && sessionRoutine) {
      setSessionOpen(true)
    } else {
      setActiveView(view)
    }
  }

  function handleSessionStart(routine) {
    setSessionRoutine(routine)
    setSessionOpen(true)
  }

  function handleSessionClose() {
    setSessionOpen(false)
  }

  function handleSessionEnd(goToRecents = false) {
    clearSavedSession()
    clearActiveSession().catch(() => {})
    setSessionRoutine(null)
    setSessionOpen(false)
    if (goToRecents) {
      setRecentsKey((k) => k + 1)
      setActiveView('recent')
    }
  }

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-black">
        <div className="w-6 h-6 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user === null) {
    return <LoginView />
  }

  function renderView() {
    if (activeView === 'home') return <HomeView refreshKey={recentsKey} />
    if (activeView === 'recent') return <RecentView refreshKey={recentsKey} />
    if (activeView === 'record') return <RecordView onSessionStart={handleSessionStart} />
    if (activeView === 'search') return <SearchView />
    if (activeView === 'profile') return <ProfileView />
    return null
  }

  return (
    <div className="relative flex flex-col h-screen bg-brand-black text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto z-0 pb-24">
        {renderView()}
      </main>
      <BottomNav
        active={activeView}
        onChange={handleNavChange}
        sessionActive={!!sessionRoutine}
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
