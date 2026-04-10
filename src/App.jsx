import { useState } from 'react'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import RecentView from './views/RecentView'
import RecordSheet from './views/RecordSheet'
import WorkoutSession, { useTimer } from './views/WorkoutSession'
import SearchView from './views/SearchView'
import ProfileView from './views/ProfileView'

const views = {
  home: HomeView,
  recent: RecentView,
  search: SearchView,
  profile: ProfileView,
}

export default function App() {
  const [activeView, setActiveView] = useState('home')
  const [recordOpen, setRecordOpen] = useState(false)
  const [sessionRoutine, setSessionRoutine] = useState(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const timer = useTimer(!!sessionRoutine)

  function handleNavChange(view) {
    if (view === 'record') {
      if (sessionRoutine) {
        // Resume active session
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
    // Collapse session to background but keep it alive — nav indicator stays
    setSessionOpen(false)
    setActiveView('home')
  }

  function handleSessionEnd() {
    setSessionRoutine(null)
    setSessionOpen(false)
    setActiveView('home')
  }

  const ActiveView = views[activeView]

  return (
    <div className="relative flex flex-col h-screen bg-brand-black text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <ActiveView />
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
        onFinish={handleSessionEnd}
        timer={timer}
      />
    </div>
  )
}
