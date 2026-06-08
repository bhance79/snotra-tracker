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
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionMiniInfo, setSessionMiniInfo] = useState(null)
  const [recentsKey, setRecentsKey] = useState(0)
  const timer = useTimer(!!sessionRoutine, sessionPaused)

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
          // Restore TIMER_KEY from the saved session if it was wiped
          if (saved.startedAt && !localStorage.getItem(TIMER_KEY)) {
            localStorage.setItem(TIMER_KEY, saved.startedAt)
          }
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
    sessionStorage.removeItem('snotra_preview_routine')
    localStorage.removeItem(TIMER_KEY)
    setSessionRoutine(routine)
    setSessionOpen(true)
    setTimeout(() => setActiveView('home'), 450)
  }

  function handleSessionClose() {
    setSessionOpen(false)
  }

  function handleSessionEnd(goToRecents = false) {
    clearSavedSession()
    clearActiveSession().catch(() => {})
    setSessionRoutine(null)
    setSessionOpen(false)
    setSessionPaused(false)
    setSessionMiniInfo(null)
    if (goToRecents) {
      setRecentsKey((k) => k + 1)
      setActiveView('recent')
    }
  }

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-black">
        <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user === null) {
    return <LoginView />
  }

  const showMiniBar = !!sessionRoutine && !sessionOpen && !!sessionMiniInfo

  return (
    <div className="relative flex flex-col h-screen bg-brand-black text-white">
      <main className={`flex-1 overflow-y-auto z-0 ${showMiniBar ? 'pb-40' : 'pb-24'}`}>
        {/* HomeView stays mounted so switching to it is instant (no flash) */}
        <div className={activeView === 'home' ? 'h-full' : 'hidden'}>
          <HomeView refreshKey={recentsKey} />
        </div>
        {activeView === 'recent'  && <RecentView refreshKey={recentsKey} />}
        {activeView === 'record'  && <RecordView onSessionStart={handleSessionStart} />}
        {activeView === 'search'  && <SearchView />}
        {activeView === 'profile' && <ProfileView />}
      </main>

      {showMiniBar && (
        <div
          className="fixed left-4 right-4 z-40 flex items-center justify-between px-4 py-3 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/10"
          style={{ bottom: 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 72px)' }}
          onClick={() => setSessionOpen(true)}
        >
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight truncate">{sessionMiniInfo.name}</p>
            <p className="text-zinc-400 text-sm mt-0.5">{sessionMiniInfo.setLabel}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSessionOpen(true) }}
            className="ml-4 shrink-0 text-white/60 active:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      )}

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
        paused={sessionPaused}
        onPause={() => setSessionPaused(true)}
        onResume={() => setSessionPaused(false)}
        onMiniInfoChange={setSessionMiniInfo}
      />
    </div>
  )
}
