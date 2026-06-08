import { useState, useEffect, useRef, useReducer } from 'react'
import { MUSCLE_COLORS } from '../data/routines'
import { EXERCISE_LIBRARY } from '../data/exercises'
import SaveActivitySheet from './SaveActivitySheet'
import { completeWorkout, getExerciseHistory, saveActiveSession, saveCustomExercise } from '../data/storage'
import ExerciseFormSheet from '../components/ExerciseFormSheet'

// ─── Session-level timer (lives in App) ───────────────────────────────────────
export const TIMER_KEY = 'snotra_timer_start'
const SESSION_KEY = 'snotra_session'

export function clearSavedSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function useTimer(running, paused = false) {
  const [, tick] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!running) {
      localStorage.removeItem(TIMER_KEY)
      tick()
      return
    }
    if (paused) {
      tick() // freeze display at current value
      return
    }
    if (!localStorage.getItem(TIMER_KEY)) {
      localStorage.setItem(TIMER_KEY, String(Date.now()))
    }
    const id = setInterval(tick, 1000)
    function onVisible() { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [running, paused])

  if (!running) return '00:00'
  const start = Number(localStorage.getItem(TIMER_KEY) ?? Date.now())
  const elapsed = Math.floor((Date.now() - start) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── Lap timer ────────────────────────────────────────────────────────────────
function useLapClock(startedAt) {
  const [, tick] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(tick, 1000)
    function onVisible() { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [startedAt])
  if (!startedAt) return null
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── Rating widget ────────────────────────────────────────────────────────────
function RatingWidget({ value, onChange }) {
  const containerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  function levelFromTouch(touch) {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = touch.clientX - rect.left
    if (x < 0) return 0
    return Math.ceil(Math.min(1, x / rect.width) * 3)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onStart(e) {
      e.stopPropagation()
      const l = levelFromTouch(e.touches[0])
      if (l !== null) onChangeRef.current(l)
    }
    function onMove(e) {
      e.stopPropagation()
      e.preventDefault()
      const l = levelFromTouch(e.touches[0])
      if (l !== null) onChangeRef.current(l)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
    }
  }, [])

  const activeColor = value === 1 ? 'bg-brand-red' : value === 2 ? 'bg-yellow-400' : value === 3 ? 'bg-emerald-400' : ''

  return (
    <div ref={containerRef} className="flex gap-1 touch-none">
      {[1, 2, 3].map((l) => (
        <div key={l} className={`w-10 h-9 rounded-md transition-colors ${l <= value ? activeColor : 'bg-zinc-700'}`} />
      ))}
    </div>
  )
}

// ─── Exercise action menu ─────────────────────────────────────────────────────
function ExerciseMenu({ onEdit, onSwitch, onRemove, onAdd, onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-black rounded-t-2xl border-t border-zinc-800 px-4 pt-4 pb-10 flex flex-col gap-2">
        <button onClick={onAdd} className="w-full py-4 rounded-xl bg-zinc-800 text-white font-semibold text-base active:bg-zinc-700 transition-colors text-left px-5">
          Add Exercise
        </button>
        <button onClick={onEdit} className="w-full py-4 rounded-xl bg-zinc-800 text-white font-semibold text-base active:bg-zinc-700 transition-colors text-left px-5">
          Edit Sets & Reps
        </button>
        <button onClick={onSwitch} className="w-full py-4 rounded-xl bg-zinc-800 text-white font-semibold text-base active:bg-zinc-700 transition-colors text-left px-5">
          Switch Exercise
        </button>
        <button onClick={onRemove} className="w-full py-4 rounded-xl bg-zinc-800 text-brand-red font-semibold text-base active:bg-zinc-700 transition-colors text-left px-5">
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── Switch exercise picker ───────────────────────────────────────────────────
function SwitchExercisePicker({ exercise, currentExercises, onSwitch, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  const currentNames = new Set(currentExercises.map((e) => e.name))
  const libRef = EXERCISE_LIBRARY.find((e) => e.name === exercise.name)
  const targetMuscles = new Set(exercise.muscles)
  const targetPattern = libRef?.pattern ?? null
  const targetCategory = libRef?.category ?? null
  const targetLiftType = libRef?.liftType ?? null
  const q = query.trim().toLowerCase()

  const pool = EXERCISE_LIBRARY.filter((ex) => {
    if (currentNames.has(ex.name) || ex.name === exercise.name) return false
    return (
      ex.muscles.some((m) => targetMuscles.has(m)) ||
      (targetPattern && ex.pattern === targetPattern) ||
      (targetCategory && ex.category === targetCategory) ||
      (targetLiftType && ex.liftType === targetLiftType)
    )
  })

  const results = q
    ? pool.filter((ex) => ex.name.toLowerCase().includes(q) || ex.muscles.some((m) => m.toLowerCase().includes(q)) || ex.pattern.toLowerCase().includes(q))
    : pool

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800 h-[75%]">
        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-semibold text-base">Switch Exercise</span>
            <button onClick={onClose} className="text-zinc-500 active:text-white transition-colors text-xl leading-none">×</button>
          </div>
          <p className="text-zinc-500 text-xs mb-3">Overlapping muscles, pattern, or category</p>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500 shrink-0">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            <input ref={inputRef} type="text" placeholder="Filter…" value={query} onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white outline-none placeholder-zinc-600 text-sm" style={{ fontSize: '16px' }} />
            {query && (
              <button onClick={() => setQuery('')} className="text-zinc-500 active:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto pb-8 px-4">
          {results.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No similar exercises found</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {results.map((ex) => (
                <button key={ex.name} onClick={() => onSwitch(ex)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-zinc-800 active:bg-zinc-700 text-left transition-colors">
                  <div className="min-w-0 mr-3">
                    <div className="text-white text-sm font-semibold truncate">{ex.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{ex.pattern} · {ex.equipment}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[130px]">
                    {ex.muscles.slice(0, 2).map((m) => (
                      <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>{m}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add exercise picker ──────────────────────────────────────────────────────
function AddExercisePicker({ currentExercises, onAdd, onClose }) {
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const inputRef = useRef(null)
  const currentNames = new Set(currentExercises.map((e) => e.name))

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  useEffect(() => {
    if (showCustomForm) return
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [showCustomForm])

  const q = query.trim().toLowerCase()
  const results = q
    ? EXERCISE_LIBRARY.filter((ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscles.some((m) => m.toLowerCase().includes(q)) ||
        ex.category.toLowerCase().includes(q) ||
        ex.pattern.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
      )
    : EXERCISE_LIBRARY

  function handleAdd(libEx) {
    onAdd({ name: libEx.name, muscles: libEx.muscles, setsReps: '3 × 10' })
    dismiss()
  }

  function handleCustomSave(exercise) {
    saveCustomExercise(exercise)
    onAdd({
      name: exercise.name,
      muscles: exercise.muscles,
      setsReps: exercise.defaultSetsReps ?? '3 × 10',
    })
    // dismiss is called by ExerciseFormSheet after its own animation
  }

  if (showCustomForm) {
    return (
      <ExerciseFormSheet
        exercise={null}
        onSave={handleCustomSave}
        onClose={() => setShowCustomForm(false)}
        actionLabel="Add to Queue"
      />
    )
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease-out' }}
        onClick={dismiss}
      />
      <div
        className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800 h-[75%]"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s ease-out',
        }}
      >
        {/* ── Library search ── */}
            <div className="px-4 pt-4 pb-3 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-base">Add Exercise</span>
                <button onClick={dismiss} className="text-zinc-500 active:text-white transition-colors text-xl leading-none">×</button>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500 shrink-0">
                  <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
                </svg>
                <input ref={inputRef} type="text" placeholder="Search exercises…" value={query} onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white outline-none placeholder-zinc-600 text-sm" style={{ fontSize: '16px' }} />
                {query && (
                  <button onClick={() => setQuery('')} className="text-zinc-500 active:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto pb-8 px-4">
              <div className="flex flex-col gap-1.5">
                {/* Custom / blank slot */}
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left border border-dashed border-zinc-600 active:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full border border-dashed border-zinc-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-500">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-sm font-semibold">Custom Exercise</div>
                    <div className="text-zinc-600 text-xs mt-0.5">Name it yourself</div>
                  </div>
                </button>

                {results.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">No exercises found</p>
                ) : (
                  results.map((ex) => {
                    const alreadyAdded = currentNames.has(ex.name)
                    return (
                      <button key={ex.name} onClick={() => !alreadyAdded && handleAdd(ex)} disabled={alreadyAdded}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-colors ${alreadyAdded ? 'bg-brand-black opacity-40 cursor-default' : 'bg-zinc-800 active:bg-zinc-700'}`}>
                        <div className="min-w-0 mr-3">
                          <div className="text-white text-sm font-semibold truncate">{ex.name}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{ex.pattern} · {ex.equipment}</div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[130px]">
                          {ex.muscles.slice(0, 2).map((m) => (
                            <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>{m}</span>
                          ))}
                          {alreadyAdded && <span className="text-xs text-zinc-500">added</span>}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
      </div>
    </div>
  )
}

// ─── Exercise archives sheet ──────────────────────────────────────────────────
function ExerciseArchivesSheet({ exerciseName, onClose }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    getExerciseHistory(exerciseName).then(setEntries)
  }, [exerciseName])

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const RATING_DOTS = [1, 2, 3]

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800 h-[75%]">
        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-semibold text-base">{exerciseName}</span>
              <p className="text-zinc-500 text-xs mt-0.5">Past sessions</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 active:text-white transition-colors text-xl leading-none">×</button>
          </div>
        </div>
        <div className="overflow-y-auto pb-8 px-4 pt-3">
          {entries === null ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-500 text-sm">No history yet</p>
              <p className="text-zinc-600 text-xs mt-1">Complete a session to see it here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {entries.map((entry, ei) => (
                <div key={ei} className="bg-brand-black border border-white/10 rounded-2xl px-4 py-3">
                  <p className="text-zinc-400 text-xs font-medium mb-2">{formatDate(entry.date)}</p>
                  <div className="grid grid-cols-[28px_1fr_1fr_auto] gap-x-3 px-1 mb-1.5">
                    <span className="text-xs text-zinc-600">Set</span>
                    <span className="text-xs text-zinc-600">Reps</span>
                    <span className="text-xs text-zinc-600">Weight</span>
                    <span className="text-xs text-zinc-600">Rating</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {entry.exercise.sets.map((s, si) => (
                      <div key={si} className="grid grid-cols-[28px_1fr_1fr_auto] gap-x-3 items-center">
                        <span className="text-xs text-zinc-500 text-center">{si + 1}</span>
                        <span className="text-sm text-white font-medium text-center">{s.reps || '—'}</span>
                        <span className="text-sm text-white font-medium text-center">{s.weight ? `${s.weight} lbs` : '—'}</span>
                        <div className="flex gap-0.5">
                          {RATING_DOTS.map((d) => (
                            <div key={d} className={`w-2.5 h-2.5 rounded-sm ${d <= (s.rating ?? 0) ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCardState(exercise) {
  return {
    sets: Array.from({ length: parseInt(exercise.setsReps) || 3 }, () => ({ reps: '', weight: '', rating: 0 })),
    done: false,
    lapStartedAt: null,
  }
}

function fmtBigTimer(mmss) {
  if (!mmss || mmss === '00:00') return '00:00:00'
  const [mm, ss] = mmss.split(':').map(Number)
  if (mm >= 60) {
    const h = Math.floor(mm / 60)
    return `${String(h).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }
  return `00:${mmss}`
}

function fmtPrescription(setsReps) {
  if (!setsReps) return setsReps
  return setsReps.replace(/^(\d+)\s*[x×]\s*(.+)$/i, '$1 sets × $2 reps')
}

function fmtLapTimer(mmss) {
  if (!mmss) return '00:00:00'
  return mmss.length === 5 ? `00:${mmss}` : mmss
}

// ─── Workout queue tray ───────────────────────────────────────────────────────
function WorkoutQueueTray({ exercises, cardStates, activeExercise, onSelectExercise, onClose, onOpenAddPicker, onReorder, onRemove }) {
  const [visible, setVisible] = useState(false)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [longPressIdx, setLongPressIdx] = useState(null)
  const [swipedOpenIdx, setSwipedOpenIdx] = useState(null)
  const [liveSwipe, setLiveSwipe] = useState(null)
  const draggingIdxRef = useRef(null)
  const dragOverIdxRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const suppressClickRef = useRef(false)
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const swipedOpenIdxRef = useRef(null)
  const isSwipeModeRef = useRef(false)
  const activeSwipeIdxRef = useRef(null)
  const liveSwipeIdxRef = useRef(null)
  const liveSwipeDxRef = useRef(0)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  function handleAdd() {
    onOpenAddPicker()
  }

  function cancelLongPress() {
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
    setLongPressIdx(null)
  }

  function handleRemove(i) {
    swipedOpenIdxRef.current = null
    setSwipedOpenIdx(null)
    setLiveSwipe(null)
    liveSwipeIdxRef.current = null
    liveSwipeDxRef.current = 0
    onRemove(i)
  }

  // All touch logic on the container so stopPropagation fires before the
  // session's sheetRef bubble-phase listeners, blocking the dismiss gesture.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onStart(e) {
      e.stopPropagation()
      isSwipeModeRef.current = false
      activeSwipeIdxRef.current = null
      setLiveSwipe(null)
      liveSwipeIdxRef.current = null
      liveSwipeDxRef.current = 0

      // Trash zone gets its own React onClick — don't interfere
      if (e.target.closest('[data-trash]')) return

      const row = e.target.closest('[data-row]')
      if (!row) {
        if (swipedOpenIdxRef.current !== null) {
          swipedOpenIdxRef.current = null
          setSwipedOpenIdx(null)
        }
        return
      }
      const idx = parseInt(row.dataset.rowIdx ?? '-1', 10)
      if (idx < 0) return

      // Close open swipe on a different row without starting interaction
      if (swipedOpenIdxRef.current !== null && swipedOpenIdxRef.current !== idx) {
        swipedOpenIdxRef.current = null
        setSwipedOpenIdx(null)
        return
      }

      touchStartYRef.current = e.touches[0].clientY
      touchStartXRef.current = e.touches[0].clientX
      activeSwipeIdxRef.current = idx
      setLongPressIdx(idx)
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null
        suppressClickRef.current = true
        // Close any swipe before drag mode
        swipedOpenIdxRef.current = null
        setSwipedOpenIdx(null)
        setLiveSwipe(null)
        liveSwipeIdxRef.current = null
        liveSwipeDxRef.current = 0
        draggingIdxRef.current = idx
        dragOverIdxRef.current = idx
        setLongPressIdx(null)
        setDraggingIdx(idx)
        setDragOverIdx(idx)
      }, 380)
    }

    function onMove(e) {
      e.stopPropagation()

      // Drag mode
      if (draggingIdxRef.current !== null) {
        e.preventDefault()
        const y = e.touches[0].clientY
        const list = listRef.current
        if (!list) return
        const rows = list.querySelectorAll('[data-row]')
        let target = rows.length - 1
        for (let i = 0; i < rows.length; i++) {
          const rect = rows[i].getBoundingClientRect()
          if (y < rect.top + rect.height / 2) { target = i; break }
        }
        dragOverIdxRef.current = target
        setDragOverIdx(target)
        return
      }

      // Swipe mode
      if (isSwipeModeRef.current) {
        e.preventDefault()
        const rawDx = e.touches[0].clientX - touchStartXRef.current
        const baseX = swipedOpenIdxRef.current === activeSwipeIdxRef.current ? -72 : 0
        const totalDx = Math.max(-72, Math.min(0, baseX + rawDx))
        liveSwipeDxRef.current = totalDx
        liveSwipeIdxRef.current = activeSwipeIdxRef.current
        setLiveSwipe({ idx: activeSwipeIdxRef.current, dx: totalDx })
        return
      }

      // Decision phase
      if (longPressTimerRef.current !== null) {
        const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current)
        const rawDx = e.touches[0].clientX - touchStartXRef.current
        const adx = Math.abs(rawDx)

        if (adx > 8 && adx > dy) {
          // Horizontal → swipe mode
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
          setLongPressIdx(null)
          isSwipeModeRef.current = true
          const baseX = swipedOpenIdxRef.current === activeSwipeIdxRef.current ? -72 : 0
          const totalDx = Math.max(-72, Math.min(0, baseX + rawDx))
          liveSwipeDxRef.current = totalDx
          liveSwipeIdxRef.current = activeSwipeIdxRef.current
          setLiveSwipe({ idx: activeSwipeIdxRef.current, dx: totalDx })
        } else if (dy > 8 && dy > adx) {
          // Vertical → scroll
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
          setLongPressIdx(null)
        }
      }
    }

    function onEnd(e) {
      e.stopPropagation()
      const touchedIdx = activeSwipeIdxRef.current
      activeSwipeIdxRef.current = null

      if (isSwipeModeRef.current) {
        isSwipeModeRef.current = false
        const dx = liveSwipeDxRef.current
        liveSwipeIdxRef.current = null
        liveSwipeDxRef.current = 0
        setLiveSwipe(null)
        suppressClickRef.current = true

        if (touchedIdx !== null) {
          if (dx < -36) {
            swipedOpenIdxRef.current = touchedIdx
            setSwipedOpenIdx(touchedIdx)
          } else {
            swipedOpenIdxRef.current = null
            setSwipedOpenIdx(null)
          }
        }
        return
      }

      cancelLongPress()
      const from = draggingIdxRef.current
      const to = dragOverIdxRef.current
      if (from !== null && to !== null && from !== to) onReorder(from, to)
      draggingIdxRef.current = null
      dragOverIdxRef.current = null
      setDraggingIdx(null)
      setDragOverIdx(null)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [onReorder])

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease-out' }}
        onClick={dismiss}
      />
      <div
        className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800"
        style={{
          maxHeight: '70%',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b border-zinc-800/60">
          <span className="text-white font-semibold text-base">Workout Queue</span>
          <button onClick={handleAdd} className="text-brand-red active:text-red-400 transition-colors text-sm font-semibold">
            Add
          </button>
        </div>

        {/* Exercise list */}
        <div ref={listRef} className="overflow-y-auto pb-8">
          {exercises.map((ex, i) => {
            const state = cardStates[i]
            const isCurrent = i === activeExercise
            const ratedSets = state?.sets?.filter((s) => s.rating > 0).length ?? 0
            const totalSets = state?.sets?.length ?? 0
            const muscles = (ex.muscles ?? []).slice(0, 2)
            const isDragging = draggingIdx === i
            const isDropAbove = draggingIdx !== null && dragOverIdx === i && draggingIdx > i
            const isDropBelow = draggingIdx !== null && dragOverIdx === i && draggingIdx < i

            const isLongPressing = longPressIdx === i
            const rowTx = liveSwipe?.idx === i ? liveSwipe.dx : swipedOpenIdx === i ? -72 : 0
            return (
              <div
                key={i}
                data-row
                data-row-idx={i}
                className={`relative overflow-hidden ${isDragging ? 'opacity-30' : 'opacity-100'} ${isDropAbove ? 'border-t-2 border-brand-red' : ''} ${isDropBelow ? 'border-b-2 border-brand-red' : ''}`}
                style={isDragging ? undefined : { transition: 'opacity 0.15s' }}
              >
                {/* Trash zone — sits behind content, revealed by left-slide */}
                <div data-trash className="absolute right-0 top-0 h-full w-[72px] bg-brand-red flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(i) }}
                    className="w-full h-full flex items-center justify-center active:bg-red-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>

                {/* Slideable row content */}
                <div
                  className="flex items-center bg-zinc-950"
                  style={{
                    transform: `translateX(${rowTx}px)`,
                    transition: (draggingIdx !== null || (liveSwipe !== null && liveSwipe.idx === i)) ? 'none' : 'transform 0.2s ease-out',
                  }}
                >
                  <button
                    className={`flex-1 flex items-center gap-3 px-3 py-3 text-left transition-colors ${isCurrent ? 'bg-white/5' : ''} ${isLongPressing ? 'bg-white/8' : 'active:bg-white/5'}`}
                    onClick={() => {
                      if (suppressClickRef.current) { suppressClickRef.current = false; return }
                      onSelectExercise(i)
                      dismiss()
                    }}
                  >
                    {/* Status indicator */}
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                      {isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      ) : ratedSets === totalSets && totalSets > 0 ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-400">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-sm text-zinc-600 font-medium">{i + 1}</span>
                      )}
                    </div>

                    {/* Name + muscles */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isCurrent ? 'text-white' : ratedSets === totalSets && totalSets > 0 ? 'text-zinc-400' : 'text-white/80'}`}>
                        {ex.name}
                      </p>
                      {muscles.length > 0 && (
                        <p className="text-xs text-zinc-600 mt-0.5 truncate">{muscles.join(' · ')}</p>
                      )}
                    </div>

                    {/* Sets progress */}
                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-medium tabular-nums ${isCurrent ? 'text-brand-red' : 'text-zinc-600'}`}>
                        {ratedSets}/{totalSets}
                      </span>
                      <p className="text-zinc-700 text-xs">sets</p>
                    </div>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Workout session ──────────────────────────────────────────────────────────
export default function WorkoutSession({ routine, open, onClose, onFinish, timer, paused, onPause, onResume, onMiniInfoChange }) {
  const [visible, setVisible] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [activeExercise, setActiveExercise] = useState(0)
  const pauseStartRef = useRef(null)
  const lapPausedElapsedRef = useRef(0)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [editSetsMode, setEditSetsMode] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [menuOpenIdx, setMenuOpenIdx] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [switchingIdx, setSwitchingIdx] = useState(null)
  const [archivesExercise, setArchivesExercise] = useState(null)

  const [exercises, setExercises] = useState([])
  const [cardStates, setCardStates] = useState([])
  const prevRoutineId = useRef(null)

  // ─── Derived current exercise ─────────────────────────────────────────────
  const currentEx = exercises[activeExercise] ?? null
  const currentState = cardStates[activeExercise] ?? (currentEx ? makeCardState(currentEx) : { sets: [], done: false, lapStartedAt: null })
  const lapTime = useLapClock(currentState.lapStartedAt ?? null)

  useEffect(() => {
    if (!onMiniInfoChange || !currentEx) return
    const nextSetIdx = currentState.sets.findIndex((s) => !s.reps && s.rating === 0)
    const setNum = nextSetIdx === -1 ? currentState.sets.length : nextSetIdx + 1
    onMiniInfoChange({ name: currentEx.name, setLabel: `set ${setNum}` })
  }, [currentEx, currentState.sets, onMiniInfoChange])

  // ─── Session init / restore ───────────────────────────────────────────────
  useEffect(() => {
    if (!routine) return
    if (routine.id !== prevRoutineId.current) {
      prevRoutineId.current = routine.id
      try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
        if (saved?.routineId === routine.id && saved.exercises?.length) {
          setExercises(saved.exercises)
          setCardStates(saved.cardStates)
          setActiveExercise(saved.activeExercise ?? 0)
          setShowPicker(false)
          return
        }
      } catch (_) {}
      const exs = routine.sections.flatMap((s) => s.exercises).filter((e) => e.selected)
      setExercises(exs)
      setCardStates(exs.map(makeCardState))
      setActiveExercise(0)
      setShowPicker(false)
    }
  }, [routine])

  // ─── Auto-save ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!routine || exercises.length === 0) return
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      routineId: routine.id, routine, exercises, cardStates, activeExercise,
      startedAt: localStorage.getItem(TIMER_KEY),
    }))
  }, [routine, exercises, cardStates, activeExercise])

  const sessionRef = useRef(null)
  useEffect(() => {
    sessionRef.current = { routine, exercises, cardStates, activeExercise }
  }, [routine, exercises, cardStates, activeExercise])

  useEffect(() => {
    function forceSave() {
      const s = sessionRef.current
      if (!s?.routine || !s.exercises?.length) return
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        routineId: s.routine.id, routine: s.routine, exercises: s.exercises,
        cardStates: s.cardStates, activeExercise: s.activeExercise,
        startedAt: localStorage.getItem(TIMER_KEY),
      }))
    }
    window.addEventListener('pagehide', forceSave)
    const onVisibility = () => { if (document.hidden) forceSave() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', forceSave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const syncTimerRef = useRef(null)
  useEffect(() => {
    if (!routine || exercises.length === 0) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      saveActiveSession({ routineId: routine.id, routine, exercises, cardStates, activeExercise, startedAt: localStorage.getItem(TIMER_KEY) }).catch(() => {})
    }, 4000)
    return () => clearTimeout(syncTimerRef.current)
  }, [routine, exercises, cardStates, activeExercise])

  // ─── State mutations ──────────────────────────────────────────────────────
  function updateCardState(i, patch) {
    setCardStates((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  function updateCurrentSet(setIdx, field, value) {
    const newSets = currentState.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s)
    updateCardState(activeExercise, { sets: newSets })
  }

  function autofillCurrentFromFirst(field) {
    const firstVal = currentState.sets[0]?.[field]
    if (!firstVal) return
    const filled = currentState.sets.map((s, i) => i > 0 && !s[field] ? { ...s, [field]: firstVal } : s)
    updateCardState(activeExercise, { sets: filled })
  }

  function addSetToCurrent() {
    updateCardState(activeExercise, { sets: [...currentState.sets, { reps: '', weight: '', rating: 0 }] })
  }

  function rateCurrentSet(setIdx, rating) {
    const newSets = currentState.sets.map((s, i) => i === setIdx ? { ...s, rating } : s)
    updateCardState(activeExercise, { sets: newSets, lapStartedAt: rating > 0 ? Date.now() : currentState.lapStartedAt })
  }

  function updateSetsReps(i, setsReps) {
    setExercises((prev) => prev.map((ex, idx) => idx === i ? { ...ex, setsReps } : ex))
  }

  function removeExercise(i) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
    setCardStates((prev) => prev.filter((_, idx) => idx !== i))
    setActiveExercise((a) => (a >= i ? Math.max(0, a - 1) : a))
    setMenuOpenIdx(null)
  }

  function reorderExercises(from, to) {
    setExercises((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setCardStates((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setActiveExercise((active) => {
      if (active === from) return to
      if (from < to && active > from && active <= to) return active - 1
      if (from > to && active >= to && active < from) return active + 1
      return active
    })
  }

  function switchExercise(i, libEx) {
    setExercises((prev) => prev.map((ex, idx) =>
      idx === i ? { name: libEx.name, muscles: libEx.muscles, setsReps: ex.setsReps } : ex
    ))
    setSwitchingIdx(null)
    setMenuOpenIdx(null)
  }

  // ─── Sheet animation + dismiss ────────────────────────────────────────────
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else { setVisible(false); setDragY(0) }
  }, [open])

  function handleClose() {
    setVisible(false)
    setDragY(0)
    setTimeout(onClose, 300)
  }

  const sheetRef = useRef(null)
  const dismissStartY = useRef(null)
  const dismissDragging = useRef(false)

  useEffect(() => {
    const el = sheetRef.current
    if (!el || !open) return
    function onStart(e) {
      const scrollEl = el.querySelector('.session-scroll')
      if (!scrollEl || scrollEl.scrollTop === 0) {
        dismissStartY.current = e.touches[0].clientY
        dismissDragging.current = true
      }
    }
    function onMove(e) {
      e.stopPropagation()
      if (!dismissDragging.current) return
      const delta = e.touches[0].clientY - dismissStartY.current
      if (delta > 0) { e.preventDefault(); setDragY(delta) }
    }
    function onEnd(e) {
      e.stopPropagation()
      if (dismissDragging.current) {
        setDragY((dy) => {
          if (dy > 120) setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 0)
          return dy > 120 ? dy : 0
        })
      }
      dismissDragging.current = false
      dismissStartY.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [open, onClose])

  if (!open || !routine) return null

  const translateStyle = visible
    ? { transform: `translateY(${dragY}px)`, transition: dragY > 0 ? 'none' : 'transform 0.3s ease-out' }
    : { transform: 'translateY(100%)', transition: 'transform 0.3s ease-out' }

  return (
    <div className="fixed inset-0 flex flex-col justify-end pointer-events-none" style={{ zIndex: 60 }}>
      <div
        ref={sheetRef}
        className="pointer-events-auto flex flex-col bg-brand-black"
        style={{ height: '100%', ...translateStyle }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="relative shrink-0">
          {/* Top row: dismiss + timer + menu */}
          <div className="flex items-center justify-between px-4 safe-top pt-3 pb-1">
            <button
              onClick={handleClose}
              className="text-white/50 active:text-white transition-colors p-2 -ml-1 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <span className="text-5xl text-white font-bold tracking-normal" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {fmtBigTimer(timer)}
            </span>
            <button
              onClick={() => currentEx && setShowEditConfirm(true)}
              className="text-white/50 active:text-white transition-colors p-2 -mr-1 shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>

          {/* Lap timer */}
          <div className="flex justify-center pt-1 pb-4">
            <span className="text-lg tracking-wider" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.55)' }}>
              {fmtLapTimer(lapTime)}
            </span>
          </div>
        </div>

        {/* ── Exercise content ─────────────────────────────────────── */}
        <div className="session-scroll flex-1 overflow-y-auto px-5 pt-2 pb-4">
          {currentEx ? (
            <>
              {/* Name */}
              <h2 className="text-3xl font-bold text-white leading-tight mb-1">
                {currentEx.name}
              </h2>

              {/* Prescription — tap to edit via menu */}
              {editingIdx === activeExercise ? (
                <input
                  autoFocus
                  type="text"
                  value={currentEx.setsReps}
                  onChange={(e) => updateSetsReps(activeExercise, e.target.value)}
                  onBlur={() => setEditingIdx(null)}
                  className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-brand-red w-44 mb-7"
                  style={{ fontSize: '16px' }}
                />
              ) : (
                <p className="text-zinc-400 text-sm mb-6 active:text-white/60 transition-colors" onClick={() => setEditingIdx(activeExercise)}>{fmtPrescription(currentEx.setsReps)}</p>
              )}

              {/* Column headers */}
              <div className="grid grid-cols-[36px_56px_1fr_128px] gap-x-3 px-1 mb-3">
                <span className="text-xs text-zinc-500 font-medium text-center">Set</span>
                <span className="text-xs text-zinc-500 font-medium text-center">Reps</span>
                <span className="text-xs text-zinc-500 font-medium text-center">Weight</span>
                <span className="text-xs text-zinc-500 font-medium">Rating</span>
              </div>

              {/* Set rows */}
              <div className="flex flex-col gap-3">
                {currentState.sets.map((set, i) => (
                  <div key={i} className="grid grid-cols-[36px_56px_1fr_128px] gap-x-3 items-center">
                    {editSetsMode ? (
                      <button
                        onClick={() => {
                          const newSets = currentState.sets.filter((_, si) => si !== i)
                          updateCardState(activeExercise, { sets: newSets })
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-red/20 text-brand-red active:bg-brand-red active:text-white transition-colors mx-auto"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-base text-zinc-400 text-center">{i + 1}</span>
                    )}
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={set.reps}
                      onChange={(e) => updateCurrentSet(i, 'reps', e.target.value)}
                      onBlur={() => i === 0 && autofillCurrentFromFirst('reps')}
                      className="w-14 bg-zinc-800 text-white text-base text-center rounded-full py-2.5 outline-none focus:ring-2 focus:ring-brand-red placeholder-zinc-600"
                      style={{ fontSize: '16px' }}
                    />
                    <div className="flex items-center bg-zinc-800 rounded-full px-4 py-2.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="—"
                        value={set.weight}
                        onChange={(e) => updateCurrentSet(i, 'weight', e.target.value)}
                        onBlur={() => i === 0 && autofillCurrentFromFirst('weight')}
                        className="bg-transparent text-white text-base text-center w-full outline-none placeholder-zinc-600 min-w-0"
                        style={{ fontSize: '16px' }}
                      />
                      <span className="text-zinc-500 text-xs ml-1 shrink-0">lbs</span>
                    </div>
                    <RatingWidget value={set.rating} onChange={(v) => rateCurrentSet(i, v)} />
                  </div>
                ))}
              </div>

              {/* Add set / Done */}
              {editSetsMode ? (
                <button
                  onClick={() => setEditSetsMode(false)}
                  className="w-full mt-7 py-3.5 rounded-full bg-zinc-800 text-white text-sm font-semibold active:bg-zinc-700 transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={addSetToCurrent}
                  className="w-full mt-7 py-3.5 rounded-full border border-dashed border-zinc-700 text-zinc-500 text-sm font-medium active:bg-zinc-800/50 transition-colors"
                >
                  + Add set
                </button>
              )}
            </>
          ) : (
            <p className="text-zinc-500 text-center py-12 text-sm">No exercises in this session</p>
          )}
        </div>

        {/* ── Bottom controls ──────────────────────────────────────── */}
        <div className="shrink-0 px-6 pt-2">
          {/* Prev | Pause/Resume+Finish | Next */}
          <div className="grid grid-cols-[72px_1fr_72px] items-center mb-2">
            <button
              onClick={() => setActiveExercise((i) => Math.max(0, i - 1))}
              disabled={activeExercise === 0}
              className="w-16 h-16 flex items-center justify-center text-white/60 active:text-white disabled:opacity-25 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            <div className="flex justify-center overflow-hidden">
            {paused ? (
              <div key="split" className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pauseDuration = Date.now() - (pauseStartRef.current ?? Date.now())
                    const start = Number(localStorage.getItem(TIMER_KEY) ?? Date.now())
                    localStorage.setItem(TIMER_KEY, String(start + pauseDuration))
                    pauseStartRef.current = null
                    if (lapPausedElapsedRef.current > 0) {
                      updateCardState(activeExercise, { lapStartedAt: Date.now() - lapPausedElapsedRef.current })
                      lapPausedElapsedRef.current = 0
                    }
                    onResume()
                  }}
                  className="anim-split-left font-semibold text-sm text-white px-5 py-4 rounded-full bg-zinc-700 active:bg-zinc-600"
                >
                  Resume
                </button>
                <button
                  onClick={() => {
                    const pauseDuration = Date.now() - (pauseStartRef.current ?? Date.now())
                    const start = Number(localStorage.getItem(TIMER_KEY) ?? Date.now())
                    localStorage.setItem(TIMER_KEY, String(start + pauseDuration))
                    pauseStartRef.current = null
                    lapPausedElapsedRef.current = 0
                    onResume()
                    setShowSummary(true)
                  }}
                  className="anim-split-right font-semibold text-sm text-white px-5 py-4 rounded-full bg-brand-red active:bg-brand-crimson"
                >
                  Finish
                </button>
              </div>
            ) : (
              <button
                key="pause"
                onClick={() => {
                  pauseStartRef.current = Date.now()
                  if (currentState.lapStartedAt) {
                    lapPausedElapsedRef.current = Date.now() - currentState.lapStartedAt
                    updateCardState(activeExercise, { lapStartedAt: null })
                  }
                  onPause()
                }}
                className="anim-merge-in flex items-center gap-2.5 bg-brand-red text-white px-10 py-4 rounded-full active:bg-brand-crimson font-semibold text-base"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                Pause
              </button>
            )}
            </div>

            <button
              onClick={() => setActiveExercise((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={activeExercise === exercises.length - 1}
              className="w-16 h-16 flex items-center justify-center text-white/60 active:text-white disabled:opacity-25 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14">
                <path d="M6 18 14.5 12 6 6v12zm9.5-12v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Archives (left) | Finish + Menu (right) */}
          <div className="flex items-center justify-between" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
            <button
              onClick={() => currentEx && setArchivesExercise(currentEx.name)}
              className="p-2 -ml-1 text-zinc-500 active:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <button
                className="p-2 text-zinc-500 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>

              <button
                onClick={() => setShowQueue(true)}
                className="p-2 -mr-1 text-zinc-500 active:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Edit confirm popup ───────────────────────────────────── */}
        {showEditConfirm && (
          <div className="absolute inset-0 z-40 flex items-center justify-center px-8" onClick={() => setShowEditConfirm(false)}>
            <div className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-white font-semibold text-base mb-1">Edit exercise</p>
              <p className="text-zinc-400 text-sm mb-5">You can remove sets from the current exercise.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditConfirm(false)}
                  className="flex-1 py-3 rounded-full bg-zinc-800 text-white text-sm font-semibold active:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowEditConfirm(false); setEditSetsMode(true) }}
                  className="flex-1 py-3 rounded-full bg-brand-red text-white text-sm font-semibold active:bg-brand-crimson transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-sheets ───────────────────────────────────────────── */}
        {showQueue && (
          <WorkoutQueueTray
            exercises={exercises}
            cardStates={cardStates}
            activeExercise={activeExercise}
            onSelectExercise={setActiveExercise}
            onClose={() => setShowQueue(false)}
            onOpenAddPicker={() => setShowPicker(true)}
            onReorder={reorderExercises}
            onRemove={removeExercise}
          />
        )}

        {showPicker && (
          <AddExercisePicker
            currentExercises={exercises}
            onAdd={(ex) => {
              setExercises((prev) => [...prev, ex])
              setCardStates((prev) => [...prev, makeCardState(ex)])
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        {menuOpenIdx !== null && (
          <ExerciseMenu
            onAdd={() => { setShowPicker(true); setMenuOpenIdx(null) }}
            onEdit={() => { setEditingIdx(menuOpenIdx); setMenuOpenIdx(null) }}
            onSwitch={() => { setSwitchingIdx(menuOpenIdx); setMenuOpenIdx(null) }}
            onRemove={() => removeExercise(menuOpenIdx)}
            onClose={() => setMenuOpenIdx(null)}
          />
        )}

        {switchingIdx !== null && (
          <SwitchExercisePicker
            exercise={exercises[switchingIdx]}
            currentExercises={exercises}
            onSwitch={(libEx) => switchExercise(switchingIdx, libEx)}
            onClose={() => setSwitchingIdx(null)}
          />
        )}

        {archivesExercise !== null && (
          <ExerciseArchivesSheet
            exerciseName={archivesExercise}
            onClose={() => setArchivesExercise(null)}
          />
        )}

        <SaveActivitySheet
          open={showSummary}
          routine={routine}
          exercises={exercises}
          cardStates={cardStates}
          onResume={() => setShowSummary(false)}
          onSave={async (notes) => {
            await completeWorkout({
              routineLabel: routine.label,
              routineSlug: routine.id,
              notes: notes || '',
              exercises: exercises.map((ex, i) => ({
                name: ex.name,
                setsReps: ex.setsReps,
                muscles: ex.muscles || [],
                sets: (cardStates[i]?.sets ?? []).filter((s) => s.reps || s.weight),
              })),
              startedAt: localStorage.getItem(TIMER_KEY),
            })
            localStorage.removeItem(SESSION_KEY)
            setShowSummary(false)
            onFinish(true)
          }}
          onDiscard={() => {
            localStorage.removeItem(SESSION_KEY)
            prevRoutineId.current = null
            setExercises([])
            setCardStates([])
            setShowSummary(false)
            onFinish(false)
          }}
        />
      </div>
    </div>
  )
}
