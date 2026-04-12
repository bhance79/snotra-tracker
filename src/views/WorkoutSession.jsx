import { useState, useEffect, useRef, useReducer } from 'react'
import { MUSCLE_COLORS } from '../data/routines'
import { EXERCISE_LIBRARY } from '../data/exercises'
import SaveActivitySheet from './SaveActivitySheet'
import { saveWorkout } from '../data/storage'

// ─── Session-level timer (lives in App) ───────────────────────────────────────
// Uses an absolute start timestamp persisted in localStorage so the timer
// keeps running correctly after the app is backgrounded or the tab is switched.
const TIMER_KEY = 'snotra_timer_start'

export function useTimer(running) {
  const [, tick] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!running) {
      localStorage.removeItem(TIMER_KEY)
      tick()
      return
    }
    // Preserve existing start across re-renders / tab restores
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
  }, [running])

  if (!running) return '00:00'
  const start = Number(localStorage.getItem(TIMER_KEY) ?? Date.now())
  const elapsed = Math.floor((Date.now() - start) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── Lap timer — absolute timestamp + visibilitychange catchup ────────────────
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

  return (
    <div ref={containerRef} className="flex gap-1 touch-none">
      {[1, 2, 3].map((l) => (
        <div key={l} className={`w-7 h-7 rounded-md transition-colors ${l <= value ? 'bg-zinc-500' : 'bg-zinc-700'}`} />
      ))}
    </div>
  )
}

// ─── Exercise card (controlled — state lives in parent) ───────────────────────
function ExerciseCard({ exercise, cardState, onCardState, isActive, onActivate, dragHandleProps, isDragging }) {
  const { sets, done, lapStartedAt } = cardState
  const lapTime = useLapClock(lapStartedAt)

  function updateSet(i, field, val) {
    const updated = sets.map((s, idx) => (idx === i ? { ...s, [field]: val } : s))
    onCardState({ sets: updated })
  }

  function autofillFromFirst(field) {
    const firstVal = sets[0][field]
    if (!firstVal) return
    const filled = sets.map((s, idx) =>
      idx > 0 && !s[field] ? { ...s, [field]: firstVal } : s
    )
    onCardState({ sets: filled })
  }

  function onRating(i, v) {
    updateSet(i, 'rating', v)
    if (v > 0) onCardState({ lapStartedAt: Date.now() })
  }

  function markDone() {
    onCardState({ done: true, lapStartedAt: null })
    onActivate()
  }

  const primaryMuscle = exercise.muscles[0]

  return (
    <div className={`rounded-2xl overflow-hidden transition-opacity ${isDragging ? 'opacity-90 ring-1 ring-white/20' : 'opacity-100'} ${done ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
      {/* Header */}
      <div className="flex items-stretch">
        <div
          ref={dragHandleProps.ref}
          onTouchStart={dragHandleProps.onTouchStart}
          onTouchEnd={dragHandleProps.onTouchEnd}
          className="flex items-center justify-center px-3 text-zinc-600 active:text-zinc-400 touch-none cursor-grab"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <rect x="4" y="5" width="16" height="2" rx="1" />
            <rect x="4" y="11" width="16" height="2" rx="1" />
            <rect x="4" y="17" width="16" height="2" rx="1" />
          </svg>
        </div>

        <button className="flex-1 pt-4 pb-3 pr-4 text-left" onClick={onActivate}>
          <div className="flex items-start justify-between">
            <span className={`text-lg font-bold ${done ? 'text-zinc-500' : 'text-white'}`}>{exercise.name}</span>
            <div className="flex items-center gap-2 shrink-0 pl-2">
              {primaryMuscle && isActive && primaryMuscle === 'Compound Lift' && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${MUSCLE_COLORS[primaryMuscle] ?? 'bg-zinc-600 text-white'}`}>
                  {primaryMuscle}
                </span>
              )}
              <button className="text-zinc-500 active:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-brand-silver text-sm mt-0.5">{exercise.setsReps}</p>
          {!isActive && (
            <>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {exercise.muscles.map((m) => (
                  <span key={m} className={`text-xs px-2.5 py-1 rounded-full font-medium ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>{m}</span>
                ))}
              </div>
              <div className="flex justify-end mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Expanded content */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-[28px_1fr_1fr_auto_20px] gap-x-2 px-1 mb-2">
            <span className="text-xs text-zinc-500 font-medium">Set</span>
            <span className="text-xs text-zinc-500 font-medium">Reps</span>
            <span className="text-xs text-zinc-500 font-medium">Weight</span>
            <span className="text-xs text-zinc-500 font-medium">Rating</span>
            <span />
          </div>
          <div className="flex flex-col gap-2">
            {sets.map((set, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_1fr_auto_20px] gap-x-2 items-center">
                <span className="text-sm text-zinc-400 text-center">{i + 1}</span>
                <input type="number" inputMode="numeric" placeholder="—" value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  onBlur={() => i === 0 && autofillFromFirst('reps')}
                  className="bg-zinc-700 text-white text-base text-center rounded-lg py-1.5 w-full outline-none focus:ring-1 focus:ring-brand-red placeholder-zinc-500"
                  style={{ fontSize: '16px' }}
                />
                <div className="flex items-center bg-zinc-700 rounded-lg px-2 py-1.5">
                  <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
                    onChange={(e) => updateSet(i, 'weight', e.target.value)}
                    onBlur={() => i === 0 && autofillFromFirst('weight')}
                    className="bg-transparent text-white text-base text-center w-full outline-none placeholder-zinc-500 min-w-0"
                    style={{ fontSize: '16px' }}
                  />
                  <span className="text-zinc-500 text-xs ml-1 shrink-0">lbs</span>
                </div>
                <RatingWidget value={set.rating} onChange={(v) => onRating(i, v)} />
                <button
                  onClick={() => onCardState({ sets: sets.filter((_, idx) => idx !== i) })}
                  className="text-zinc-600 active:text-brand-red transition-colors text-base leading-none"
                >×</button>
              </div>
            ))}
          </div>

          {/* Rest / lap timer */}
          {lapTime !== null && (
            <div className="flex items-center justify-center gap-2 mt-4 py-2 rounded-xl bg-zinc-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-brand-silver">
                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 15.5" />
              </svg>
              <span className="text-white font-mono text-sm">Rest {lapTime}</span>
            </div>
          )}

          <button
            onClick={() => onCardState({ sets: [...sets, { reps: '', weight: '', rating: 0 }] })}
            className="w-full mt-3 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium active:bg-zinc-700 transition-colors"
          >
            + Add Set
          </button>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-3 rounded-xl bg-zinc-700 text-white text-sm font-semibold active:bg-zinc-600 transition-colors">Archives</button>
            <button onClick={markDone} className="flex-1 py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold active:bg-zinc-800 transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add exercise picker ──────────────────────────────────────────────────────
function AddExercisePicker({ currentExercises, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const currentNames = new Set(currentExercises.map((e) => e.name))

  useEffect(() => {
    // Small delay so the sheet finishes animating before keyboard pops
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

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
    onAdd({
      name: libEx.name,
      muscles: libEx.muscles,
      setsReps: '3 × 10',
    })
    onClose()
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800 h-[75%]">
        {/* Header + search */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-base">Add Exercise</span>
            <button onClick={onClose} className="text-zinc-500 active:text-white transition-colors text-xl leading-none">×</button>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 text-zinc-500 shrink-0">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search exercises…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white outline-none placeholder-zinc-600 text-sm"
              style={{ fontSize: '16px' }}
            />
            {query ? (
              <button onClick={() => setQuery('')} className="text-zinc-500 active:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto pb-8 px-4">
          {results.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No exercises found</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {results.map((ex) => {
                const alreadyAdded = currentNames.has(ex.name)
                return (
                  <button
                    key={ex.name}
                    onClick={() => !alreadyAdded && handleAdd(ex)}
                    disabled={alreadyAdded}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-colors ${
                      alreadyAdded
                        ? 'bg-zinc-900 opacity-40 cursor-default'
                        : 'bg-zinc-800 active:bg-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 mr-3">
                      <div className="text-white text-sm font-semibold truncate">{ex.name}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{ex.pattern} · {ex.equipment}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[130px]">
                      {ex.muscles.slice(0, 2).map((m) => (
                        <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>
                          {m}
                        </span>
                      ))}
                      {alreadyAdded && <span className="text-xs text-zinc-500">added</span>}
                    </div>
                  </button>
                )
              })}
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

// ─── Workout session ──────────────────────────────────────────────────────────
export default function WorkoutSession({ routine, open, onClose, onFinish, timer }) {
  const [visible, setVisible] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [activeExercise, setActiveExercise] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // exercises + per-card state — persists across open/close, resets only on new session
  const [exercises, setExercises] = useState([])
  const [cardStates, setCardStates] = useState([])
  const prevRoutineId = useRef(null)

  // Init/reset only when a new routine starts, not on open/close toggle
  useEffect(() => {
    if (!routine) return
    if (routine.id !== prevRoutineId.current) {
      prevRoutineId.current = routine.id
      const exs = routine.sections.flatMap((s) => s.exercises).filter((e) => e.selected)
      setExercises(exs)
      setCardStates(exs.map(makeCardState))
      setActiveExercise(0)
      setShowPicker(false)
    }
  }, [routine])

  function updateCardState(i, patch) {
    setCardStates((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  // Sheet slide animation
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else { setVisible(false); setDragY(0) }
  }, [open])

  function handleClose() {
    setVisible(false)
    setDragY(0)
    setTimeout(onClose, 300)
  }

  // Drag-to-reorder
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const cardRefs = useRef([])
  const dragIndexRef = useRef(null)
  const dropIndexRef = useRef(null)
  const isDraggingItem = useRef(false)

  function getDropIndex(clientY) {
    let idx = exercises.length
    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) { idx = i; break }
    }
    return idx
  }

  function makeDragHandleProps(index) {
    return {
      ref(el) {
        if (!el) return
        el._onTouchMove = (e) => {
          if (dragIndexRef.current === null) return
          e.stopPropagation()
          e.preventDefault()
          const newDrop = getDropIndex(e.touches[0].clientY)
          dropIndexRef.current = newDrop
          setDropIndex(newDrop)
        }
        el.removeEventListener('touchmove', el._onTouchMove)
        el.addEventListener('touchmove', el._onTouchMove, { passive: false })
      },
      onTouchStart(e) {
        e.stopPropagation()
        isDraggingItem.current = true
        dragIndexRef.current = index
        dropIndexRef.current = index
        setDragIndex(index)
        setDropIndex(index)
      },
      onTouchEnd(e) {
        e.stopPropagation()
        const di = dragIndexRef.current
        const dri = dropIndexRef.current
        if (di !== null && dri !== null && di !== dri) {
          setExercises((prev) => {
            const arr = [...prev]
            const [item] = arr.splice(di, 1)
            arr.splice(Math.max(0, dri > di ? dri - 1 : dri), 0, item)
            return arr
          })
          setCardStates((prev) => {
            const arr = [...prev]
            const [item] = arr.splice(di, 1)
            arr.splice(Math.max(0, dri > di ? dri - 1 : dri), 0, item)
            return arr
          })
        }
        dragIndexRef.current = null
        dropIndexRef.current = null
        setDragIndex(null)
        setDropIndex(null)
        isDraggingItem.current = false
      },
    }
  }

  // Sheet dismiss touch
  const sheetRef = useRef(null)
  const dismissStartY = useRef(null)
  const dismissDragging = useRef(false)

  useEffect(() => {
    const el = sheetRef.current
    if (!el || !open) return
    function onStart(e) {
      if (isDraggingItem.current) return
      const scrollEl = el.querySelector('.session-scroll')
      if (!scrollEl || scrollEl.scrollTop === 0) {
        dismissStartY.current = e.touches[0].clientY
        dismissDragging.current = true
      }
    }
    function onMove(e) {
      if (isDraggingItem.current) return
      e.stopPropagation()
      if (!dismissDragging.current) return
      const delta = e.touches[0].clientY - dismissStartY.current
      if (delta > 0) { e.preventDefault(); setDragY(delta) }
    }
    function onEnd(e) {
      if (isDraggingItem.current) return
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

  function renderExercises() {
    const items = []
    exercises.forEach((ex, i) => {
      if (dropIndex === i && dragIndex !== null && dragIndex !== i)
        items.push(<div key={`drop-${i}`} className="h-1 rounded-full bg-brand-red mx-2" />)
      const isBeingDragged = dragIndex === i
      items.push(
        <div
          key={ex.name}
          ref={(el) => (cardRefs.current[i] = el)}
          className={`transition-transform duration-150 ${isBeingDragged ? 'scale-[1.03] relative z-10' : 'scale-100'}`}
          style={isBeingDragged ? { filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.7))' } : undefined}
        >
          <ExerciseCard
            exercise={ex}
            cardState={cardStates[i] ?? makeCardState(ex)}
            onCardState={(patch) => updateCardState(i, patch)}
            isActive={activeExercise === i}
            onActivate={() => setActiveExercise(activeExercise === i ? null : i)}
            dragHandleProps={makeDragHandleProps(i)}
            isDragging={isBeingDragged}
          />
        </div>
      )
    })
    if (dropIndex === exercises.length && dragIndex !== null)
      items.push(<div key="drop-end" className="h-1 rounded-full bg-brand-red mx-2" />)
    return items
  }

  if (!open || !routine) return null

  const translateStyle = visible
    ? { transform: `translateY(${dragY}px)`, transition: dragY > 0 ? 'none' : 'transform 0.3s ease-out' }
    : { transform: 'translateY(100%)', transition: 'transform 0.3s ease-out' }

  return (
    <div className="absolute inset-0 z-70 flex flex-col justify-end pointer-events-none">
      <div ref={sheetRef} className="pointer-events-auto flex flex-col bg-brand-black"
        style={{ height: '100%', ...translateStyle }}>
        {/* Top bar — chevron only */}
        <div className="px-4 pb-2 shrink-0 safe-top">
          <button onClick={handleClose} className="text-brand-silver active:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h1 className="text-3xl font-bold text-white">{routine.label}</h1>
          <div className="flex items-center gap-3">
            <span className="text-white font-mono text-base">{timer}</span>
            <button onClick={() => setShowSummary(true)} className="bg-brand-red text-white text-sm font-semibold px-5 py-2 rounded-full active:bg-brand-crimson transition-colors">
              Finish
            </button>
          </div>
        </div>

        <div className="session-scroll flex-1 overflow-y-auto px-4 pb-8">
          <div className="flex flex-col gap-3">{renderExercises()}</div>
          <button onClick={() => setShowPicker(true)}
            className="w-full mt-4 py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm font-medium active:bg-zinc-800 transition-colors">
            + Add Exercise
          </button>
        </div>

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

        <SaveActivitySheet
          open={showSummary}
          routine={routine}
          exercises={exercises}
          cardStates={cardStates}
          onResume={() => setShowSummary(false)}
          onSave={async (notes) => {
            await saveWorkout({
              id: Date.now().toString(),
              date: new Date().toISOString(),
              routine_id: routine.id,
              routine_label: routine.label,
              notes: notes || '',
              exercises: exercises.map((ex, i) => ({
                name: ex.name,
                setsReps: ex.setsReps,
                muscles: ex.muscles || [],
                sets: (cardStates[i]?.sets ?? []).filter((s) => s.reps || s.weight),
              })),
            })
            setShowSummary(false)
            onFinish(true)
          }}
          onDiscard={() => {
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
