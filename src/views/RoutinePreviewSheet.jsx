import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MUSCLE_COLORS, ROUTINE_GROUPS } from '../data/routines'
import { getLastWorkoutDate } from '../data/storage'

// All unique exercises across every routine, sorted A-Z — computed once at module load
const ALL_EXERCISES = (() => {
  const seen = new Set()
  const result = []
  for (const group of ROUTINE_GROUPS) {
    for (const variation of group.variations) {
      for (const section of variation.sections) {
        for (const ex of section.exercises) {
          if (!seen.has(ex.name)) {
            seen.add(ex.name)
            result.push({ name: ex.name, muscles: ex.muscles, setsReps: ex.setsReps })
          }
        }
      }
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name))
})()

// Related muscles for broadening alternate search — e.g. Side Delts → all delts
const MUSCLE_RELATIVES = {
  'Side Delts':    ['Front Delts', 'Rear Delts', 'Traps'],
  'Front Delts':   ['Side Delts', 'Rear Delts', 'Traps'],
  'Rear Delts':    ['Side Delts', 'Front Delts', 'Rhomboids', 'Traps'],
  'Traps':         ['Rear Delts', 'Rhomboids', 'Lats', 'Front Delts', 'Side Delts'],
  'Lats':          ['Rhomboids', 'Rear Delts', 'Traps', 'Erectors'],
  'Rhomboids':     ['Lats', 'Rear Delts', 'Traps'],
  'Erectors':      ['Lats', 'Rhomboids', 'Glutes'],
  'Biceps':        ['Brachialis'],
  'Brachialis':    ['Biceps'],
  'Quads':         ['Glutes', 'Hip Flexors'],
  'Hamstrings':    ['Glutes', 'Erectors'],
  'Glutes':        ['Hamstrings', 'Quads', 'Hip Abductors', 'Hip Adductors', 'Erectors'],
  'Hip Flexors':   ['Quads', 'Glutes'],
  'Hip Abductors': ['Glutes', 'Hip Adductors'],
  'Hip Adductors': ['Glutes', 'Hip Abductors'],
  'Core':          ['Erectors', 'Hip Flexors'],
}

function formatLastRecorded(isoString) {
  if (!isoString) return null
  const d = new Date(isoString)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function formatSetsReps(str) {
  if (!str) return str
  const [rawSets, rawReps] = str.split('×')
  if (!rawReps) return str
  const sets = rawSets.trim()
  const repsStr = rawReps.trim()
  const hasEa = repsStr.endsWith('ea.')
  const reps = hasEa ? repsStr.slice(0, -3).trim() : repsStr
  return `${sets} sets × ${reps} reps${hasEa ? ' ea.' : ''}`
}

const OVERRIDES_KEY = 'snotra_routine_overrides'

function getOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}') }
  catch { return {} }
}

function saveOverride(id, label, subtitle) {
  const all = getOverrides()
  all[id] = { label, subtitle }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))
}

export function getRoutineOverride(routineId) {
  return getOverrides()[routineId] ?? null
}

export default function RoutinePreview({ routine, onBack, onStart }) {
  const saved = getOverrides()[routine.id] ?? {}
  const [label, setLabel] = useState(saved.label ?? routine.label)
  const [subtitle, setSubtitle] = useState(saved.subtitle ?? routine.subtitle ?? '')
  const [editMode, setEditMode] = useState(false)
  const [showNameSheet, setShowNameSheet] = useState(false)
  const [nameSheetVisible, setNameSheetVisible] = useState(false)
  const [nameSheetDragY, setNameSheetDragY] = useState(0)
  const nameSheetRef = useRef(null)
  const dragStartY = useRef(null)
  const dragging = useRef(false)
  const [nameInput, setNameInput] = useState(label)
  const [subtitleInput, setSubtitleInput] = useState(subtitle)
  const [lastRecorded, setLastRecorded] = useState(null)

  useEffect(() => {
    getLastWorkoutDate(label).then((date) => setLastRecorded(formatLastRecorded(date)))
  }, [label])

  // ─── Add exercise sheet ───────────────────────────────────────────────────
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [addSheetVisible, setAddSheetVisible] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [keyboardH, setKeyboardH] = useState(0)
  const [addSheetDragY, setAddSheetDragY] = useState(0)
  const addSheetRef = useRef(null)
  const addDragStartY = useRef(null)
  const addDragging = useRef(false)

  // ─── Alternate confirmation popup ────────────────────────────────────────
  const [confirmSwapEx, setConfirmSwapEx] = useState(null)
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false)

  useEffect(() => {
    if (confirmSwapEx) requestAnimationFrame(() => setConfirmPopupVisible(true))
    else setConfirmPopupVisible(false)
  }, [confirmSwapEx])

  function closeConfirmSwap() {
    setConfirmPopupVisible(false)
    setTimeout(() => setConfirmSwapEx(null), 250)
  }

  function confirmAndSwap() {
    const ex = confirmSwapEx
    closeConfirmSwap()
    setTimeout(() => setSwapExercise(ex), 250)
  }

  // ─── Swap (alternate) sheet ───────────────────────────────────────────────
  const [swapExercise, setSwapExercise] = useState(null)
  const [swapSheetVisible, setSwapSheetVisible] = useState(false)
  const [swapSheetDragY, setSwapSheetDragY] = useState(0)
  const swapSheetRef = useRef(null)
  const swapDragStartY = useRef(null)
  const swapDragging = useRef(false)

  useEffect(() => {
    if (showAddSheet) requestAnimationFrame(() => setAddSheetVisible(true))
    else setAddSheetVisible(false)
  }, [showAddSheet])

  useEffect(() => {
    if (!showAddSheet) { setKeyboardH(0); return }
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      setKeyboardH(Math.max(0, window.innerHeight - vv.height))
    }
    vv.addEventListener('resize', onResize)
    return () => { vv.removeEventListener('resize', onResize); setKeyboardH(0) }
  }, [showAddSheet])

  function closeAddSheet() {
    setAddSheetVisible(false)
    setAddSheetDragY(0)
    setTimeout(() => { setShowAddSheet(false); setAddSearch('') }, 300)
  }

  useEffect(() => {
    const el = addSheetRef.current
    if (!el || !showAddSheet) return
    function onStart(e) {
      addDragStartY.current = e.touches[0].clientY
      addDragging.current = true
    }
    function onMove(e) {
      if (!addDragging.current) return
      const delta = e.touches[0].clientY - addDragStartY.current
      if (delta > 0) { e.preventDefault(); setAddSheetDragY(delta) }
    }
    function onEnd() {
      if (addDragging.current) {
        setAddSheetDragY((dy) => {
          if (dy > 80) setTimeout(closeAddSheet, 0)
          return dy > 80 ? dy : 0
        })
      }
      addDragging.current = false
      addDragStartY.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [showAddSheet])

  useEffect(() => {
    if (swapExercise) requestAnimationFrame(() => setSwapSheetVisible(true))
    else setSwapSheetVisible(false)
  }, [swapExercise])

  function closeSwapSheet() {
    setSwapSheetVisible(false)
    setSwapSheetDragY(0)
    setTimeout(() => setSwapExercise(null), 300)
  }

  useEffect(() => {
    const el = swapSheetRef.current
    if (!el || !swapExercise) return
    function onStart(e) {
      swapDragStartY.current = e.touches[0].clientY
      swapDragging.current = true
    }
    function onMove(e) {
      if (!swapDragging.current) return
      const delta = e.touches[0].clientY - swapDragStartY.current
      if (delta > 0) { e.preventDefault(); setSwapSheetDragY(delta) }
    }
    function onEnd() {
      if (swapDragging.current) {
        setSwapSheetDragY((dy) => {
          if (dy > 80) setTimeout(closeSwapSheet, 0)
          return dy > 80 ? dy : 0
        })
      }
      swapDragging.current = false
      swapDragStartY.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [swapExercise])

  function getAlternatives(ex) {
    const direct = new Set(ex.muscles ?? [])
    const expanded = new Set(direct)
    for (const m of direct) {
      for (const rel of MUSCLE_RELATIVES[m] ?? []) expanded.add(rel)
    }
    return ALL_EXERCISES
      .filter(e => e.name !== ex.name && !exercises.some(curr => curr.name === e.name))
      .map(e => {
        const muscles = e.muscles ?? []
        const directOverlap = muscles.filter(m => direct.has(m)).length
        const groupOverlap = muscles.filter(m => expanded.has(m)).length
        return { ...e, directOverlap, groupOverlap }
      })
      .filter(e => e.groupOverlap > 0)
      .sort((a, b) =>
        b.directOverlap - a.directOverlap ||
        b.groupOverlap - a.groupOverlap ||
        a.name.localeCompare(b.name)
      )
  }

  function handleSwapExercise(replacement) {
    setExercises(prev => prev.map(e =>
      e.name === swapExercise.name
        ? { ...replacement, _section: e._section }
        : e
    ))
    closeSwapSheet()
  }

  function handleAddExercise(ex) {
    if (exercises.some(e => e.name === ex.name)) return
    const section = exercises[exercises.length - 1]?._section ?? (routine.sections[0]?.title ?? 'Main')
    setExercises(prev => [...prev, { ...ex, _section: section }])
  }

  // ─── Scroll-driven header collapse ───────────────────────────────────────
  const scrollRef = useRef(null)
  const titleAreaRef = useRef(null)
  const actionAreaRef = useRef(null)
  const titleNaturalH = useRef(0)
  const actionNaturalH = useRef(0)
  const rafRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const SCROLL_RANGE = 120
  const headerRef = useRef(null)
  const [headerTotalH, setHeaderTotalH] = useState(0)

  // Measure the full undocked header height once and never change it.
  // Keeping paddingTop constant means scroll is purely physical — no content
  // jump as the header collapses, which is what caused the magnetic snap feel.
  useLayoutEffect(() => {
    const h = (headerRef.current?.offsetHeight ?? 0) + (actionAreaRef.current?.offsetHeight ?? 0)
    if (h > 0) setHeaderTotalH(h)
  }, [])

  useEffect(() => {
    if (titleAreaRef.current) titleNaturalH.current = titleAreaRef.current.scrollHeight
    if (actionAreaRef.current) actionNaturalH.current = actionAreaRef.current.scrollHeight
  }, [label, subtitle, lastRecorded])

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }, [])

  function handleScroll() {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      const y = scrollRef.current?.scrollTop ?? 0
      setProgress(Math.min(1, Math.max(0, y / SCROLL_RANGE)))
      rafRef.current = null
    })
  }

  // interpolated style values
  const headerPb = 56 - 44 * progress                    // ~56px → 12px
  const titleH = progress > 0 && titleNaturalH.current > 0
    ? Math.max(0, titleNaturalH.current * (1 - progress))
    : undefined
  const actionH = progress > 0 && actionNaturalH.current > 0
    ? Math.max(0, actionNaturalH.current * (1 - progress))
    : undefined
  const playBottom = 16 * (1 - progress)                 // 1rem → 0
  const playTranslate = 50 * progress                    // translateY 0% → 50%

  useEffect(() => {
    if (showNameSheet) {
      requestAnimationFrame(() => setNameSheetVisible(true))
    } else {
      setNameSheetVisible(false)
      setNameSheetDragY(0)
    }
  }, [showNameSheet])

  useEffect(() => {
    const el = nameSheetRef.current
    if (!el || !showNameSheet) return

    function onStart(e) {
      dragStartY.current = e.touches[0].clientY
      dragging.current = true
    }
    function onMove(e) {
      if (!dragging.current) return
      const delta = e.touches[0].clientY - dragStartY.current
      if (delta > 0) {
        e.preventDefault()
        setNameSheetDragY(delta)
      }
    }
    function onEnd() {
      if (dragging.current) {
        setNameSheetDragY((dy) => {
          if (dy > 80) setTimeout(closeNameSheet, 0)
          return dy > 80 ? dy : 0
        })
      }
      dragging.current = false
      dragStartY.current = null
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [showNameSheet])

  const flat = routine.sections.flatMap((s) =>
    s.exercises.map((ex) => ({ ...ex, _section: s.title }))
  )
  const PENDING_KEY = `snotra_pending_${routine.id}`
  const [exercises, setExercises] = useState(() => {
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null')
      if (Array.isArray(pending) && pending.length > 0) return pending
    } catch {}
    return flat
  })

  useEffect(() => {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(exercises))
  }, [exercises])

  // ─── Drag-to-reorder state ────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const cardRefs = useRef([])
  const dragIndexRef = useRef(null)
  const dropIndexRef = useRef(null)

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
        }
        dragIndexRef.current = null
        dropIndexRef.current = null
        setDragIndex(null)
        setDropIndex(null)
      },
    }
  }

  function handleDelete(name) {
    setExercises((prev) => prev.filter((e) => e.name !== name))
  }

  function closeNameSheet() {
    setNameSheetVisible(false)
    setNameSheetDragY(0)
    setTimeout(() => setShowNameSheet(false), 300)
  }

  function handleSaveName() {
    setLabel(nameInput)
    setSubtitle(subtitleInput)
    saveOverride(routine.id, nameInput, subtitleInput)
    closeNameSheet()
  }

  function handleStart() {
    const sectionMap = new Map()
    for (const ex of exercises) {
      if (!sectionMap.has(ex._section)) sectionMap.set(ex._section, [])
      sectionMap.get(ex._section).push(ex)
    }
    const sections = Array.from(sectionMap.entries()).map(([title, exs]) => ({ title, exercises: exs }))
    onStart({ ...routine, label, subtitle, sections })
  }

  return (
    <div className="relative h-full bg-brand-black">
      {/* Header + actions sit above the scroll layer */}
      <div
        className="relative z-10"
        style={{
          background: 'rgba(18, 18, 18, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 0.5px 0 rgba(255, 255, 255, ${0.14 * progress})`,
        }}
      >
      {/* Header */}
      <div
        ref={headerRef}
        className="relative px-4 safe-top shrink-0"
        style={{ paddingBottom: `${headerPb}px` }}
      >
        {/* Top row: back button + title that fades in as you scroll */}
        <div className="flex items-center py-2">
          <button
            onClick={onBack}
            className="text-zinc-400 active:text-white transition-colors -ml-1 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1
            style={{ opacity: progress }}
            className="flex-1 text-center text-lg font-bold text-white font-baskerville px-2 truncate"
          >
            {label}
          </h1>
          {/* spacer matches back button width to keep title visually centred */}
          <div className="w-7 shrink-0" />
        </div>

        {/* Expanded title + subtitle — shrinks and fades as you scroll */}
        <div
          ref={titleAreaRef}
          style={{
            height: titleH !== undefined ? `${titleH}px` : undefined,
            opacity: 1 - progress,
            overflow: 'hidden',
            marginTop: `${20 * (1 - progress)}px`,
          }}
          className="pr-20"
        >
          <h1 className="text-3xl font-bold text-white font-baskerville leading-tight">{label}</h1>
          {subtitle && (
            <p className="text-brand-silver text-sm mt-3">{subtitle}</p>
          )}
          <p className="text-zinc-600 text-sm mt-4">
            last recorded {lastRecorded ?? '—'}
          </p>
        </div>

        {/* Single play button — slides continuously from title-level to docked */}
        <button
          onClick={handleStart}
          style={{
            bottom: `${playBottom}px`,
            transform: `translateY(${playTranslate}%)`,
          }}
          className="absolute right-4 w-16 h-16 rounded-full bg-brand-red flex items-center justify-center active:bg-red-800 shadow-lg z-10"
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-0.5">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </button>
      </div>

      {/* Action buttons — shrink and fade with scroll */}
      <div
        ref={actionAreaRef}
        style={{
          height: actionH !== undefined ? `${actionH}px` : undefined,
          opacity: 1 - progress,
          overflow: 'hidden',
        }}
      >
        <div className="flex gap-2 px-4 pt-2 pb-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium active:bg-zinc-700 transition-colors"
          >
            + Add
          </button>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              editMode ? 'bg-brand-red text-white' : 'bg-zinc-800 text-white active:bg-zinc-700'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="3" y="11" width="18" height="2" rx="1" />
              <rect x="3" y="17" width="18" height="2" rx="1" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => {
              setNameInput(label)
              setSubtitleInput(subtitle)
              setShowNameSheet(true)
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium active:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Name & Details
          </button>
        </div>
      </div>
      </div>{/* end z-10 header+actions wrapper */}

      {/* Exercise list — absolute so its viewport never resizes during header collapse */}
      <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto px-4 pb-24" style={{ paddingTop: `${headerTotalH}px` }}>
        <div className="flex flex-col gap-3">
          {(() => {
            const items = []
            exercises.forEach((ex, i) => {
              if (editMode && dropIndex === i && dragIndex !== null && dragIndex !== i)
                items.push(<div key={`drop-${i}`} className="h-1 rounded-full bg-brand-red" />)

              const isBeingDragged = dragIndex === i
              const hp = editMode ? makeDragHandleProps(i) : null

              items.push(
                <div
                  key={ex.name}
                  ref={(el) => (cardRefs.current[i] = el)}
                  className={`bg-brand-card rounded-2xl px-4 py-10 border border-white/10 transition-transform duration-150 ${isBeingDragged ? 'scale-[1.02] relative z-10' : 'scale-100'}`}
                  style={isBeingDragged ? { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))' } : undefined}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {editMode && (
                        <div
                          ref={hp.ref}
                          onTouchStart={hp.onTouchStart}
                          onTouchEnd={hp.onTouchEnd}
                          className="text-zinc-600 active:text-zinc-400 touch-none cursor-grab pt-0.5 shrink-0"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <rect x="3" y="5" width="18" height="2" rx="1" />
                            <rect x="3" y="11" width="18" height="2" rx="1" />
                            <rect x="3" y="17" width="18" height="2" rx="1" />
                          </svg>
                        </div>
                      )}
                      <span className="text-xl font-bold text-white leading-snug font-baskerville">{ex.name}</span>
                    </div>
                    {editMode ? (
                      <button
                        onClick={() => handleDelete(ex.name)}
                        className="text-brand-red active:text-red-300 pt-0.5 shrink-0 transition-colors ml-2"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmSwapEx(ex)}
                        className="text-zinc-500 active:text-white pt-0.5 shrink-0 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {!editMode && (
                    <>
                      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
                        {ex.muscles.map((m) => (
                          <span key={m} className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-brand-silver text-sm">{formatSetsReps(ex.setsReps)}</p>
                    </>
                  )}
                </div>
              )
            })
            if (editMode && dropIndex === exercises.length && dragIndex !== null)
              items.push(<div key="drop-end" className="h-1 rounded-full bg-brand-red" />)
            return items
          })()}
        </div>
      </div>

      {/* Add Exercise sheet */}
      {showAddSheet && createPortal(
        <div className="fixed inset-0 z-[110]">
          {/* Dimmed backdrop — shows the screen behind, faded */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeAddSheet}
            style={{ opacity: addSheetVisible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
          />
          {/* Sheet — leaves ~72px at top so the background peeks through */}
          <div
            className="absolute inset-x-0 bg-brand-black rounded-t-3xl flex flex-col"
            style={{
              top: '72px',
              bottom: `${keyboardH}px`,
              transform: addSheetVisible ? `translateY(${addSheetDragY}px)` : 'translateY(100%)',
              transition: addSheetDragY > 0 ? 'none' : 'transform 0.3s ease-out, bottom 0.25s ease-out',
            }}
          >
          {/* Drag handle + header — touch target for drag-to-dismiss */}
          <div ref={addSheetRef} className="shrink-0">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
              <h2 className="text-lg font-bold font-baskerville text-white">Add Exercise</h2>
              <button onClick={closeAddSheet} className="text-zinc-400 active:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Exercise list */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const q = addSearch.trim().toLowerCase()
              const list = q ? ALL_EXERCISES.filter(ex => ex.name.toLowerCase().includes(q)) : ALL_EXERCISES
              return list.map(ex => {
                const added = exercises.some(e => e.name === ex.name)
                return (
                  <div key={ex.name} className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-bold font-baskerville text-white block leading-snug">{ex.name}</span>
                      <div className="flex gap-1 mt-1.5 overflow-x-auto scrollbar-none">
                        {ex.muscles?.map(m => (
                          <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddExercise(ex)}
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        added ? 'bg-zinc-800 text-zinc-500' : 'bg-brand-red/15 text-brand-red active:bg-brand-red/30'
                      }`}
                    >
                      {added ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })
            })()}
          </div>

          {/* Search bar — footer */}
          <div className="px-4 pt-3 shrink-0 border-t border-white/10 bg-brand-black safe-bottom">
            <input
              type="search"
              inputMode="search"
              placeholder="Search exercises…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-2xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-brand-red placeholder:text-zinc-500"
            />
          </div>
          </div>{/* end sheet */}
        </div>,
        document.body
      )}

      {/* Alternate confirmation popup */}
      {confirmSwapEx && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div
            className="absolute inset-0"
            onClick={closeConfirmSwap}
            style={{ background: confirmPopupVisible ? 'rgba(0,0,0,0.55)' : 'transparent', transition: 'background 0.25s ease-out' }}
          />
          <div
            className="relative w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-5"
            style={{
              transform: confirmPopupVisible ? 'scale(1)' : 'scale(0.95)',
              opacity: confirmPopupVisible ? 1 : 0,
              transition: 'transform 0.25s ease-out, opacity 0.25s ease-out',
            }}
          >
            <p className="text-white text-base font-semibold text-center mb-1 font-baskerville">Alternate workout?</p>
            <p className="text-zinc-400 text-sm text-center mb-5">{confirmSwapEx.name}</p>
            <div className="flex gap-3">
              <button
                onClick={closeConfirmSwap}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium active:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSwap}
                className="flex-1 py-3 rounded-xl bg-brand-red text-white text-sm font-semibold active:bg-red-700 transition-colors"
              >
                Alternate
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Alternate (swap) sheet */}
      {swapExercise && createPortal(
        <div className="fixed inset-0 z-[110]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeSwapSheet}
            style={{ opacity: swapSheetVisible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-brand-black rounded-t-3xl flex flex-col"
            style={{
              top: '72px',
              transform: swapSheetVisible ? `translateY(${swapSheetDragY}px)` : 'translateY(100%)',
              transition: swapSheetDragY > 0 ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Drag handle + header */}
            <div ref={swapSheetRef} className="shrink-0">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-zinc-600" />
              </div>
              <div className="flex items-start justify-between px-4 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold font-baskerville text-white">Alternate</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">{swapExercise.name}</p>
                </div>
                <button onClick={closeSwapSheet} className="text-zinc-400 active:text-white transition-colors pt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Alternatives list */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const alts = getAlternatives(swapExercise)
                if (alts.length === 0) return (
                  <p className="text-zinc-500 text-sm text-center py-10">No alternatives found</p>
                )
                return alts.map(alt => (
                  <div key={alt.name} className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-bold font-baskerville text-white block leading-snug">{alt.name}</span>
                      <div className="flex gap-1 mt-1.5 overflow-x-auto scrollbar-none">
                        {alt.muscles?.map(m => (
                          <span key={m} className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSwapExercise(alt)}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-brand-red/15 text-brand-red text-sm font-semibold active:bg-brand-red/30 transition-colors"
                    >
                      Swap
                    </button>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Name & Details — portalled to document.body to escape main's stacking context */}
      {showNameSheet && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeNameSheet}
          />
          <div
            ref={nameSheetRef}
            className="relative bg-brand-black rounded-t-2xl px-4 pt-3 pb-16 border border-white/10"
            style={{
              minHeight: '44%',
              transform: nameSheetVisible ? `translateY(${nameSheetDragY}px)` : 'translateY(100%)',
              transition: nameSheetDragY > 0 ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={closeNameSheet}
                className="text-zinc-400 active:text-white transition-colors text-base"
              >
                Cancel
              </button>
              <h2 className="text-base font-semibold text-white">Name & Details</h2>
              <button
                onClick={handleSaveName}
                className="text-brand-red active:text-red-400 transition-colors text-base font-semibold"
              >
                Save
              </button>
            </div>

            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Routine name</p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-xl px-3 py-3 text-base mb-3 outline-none focus:ring-1 focus:ring-brand-red"
            />

            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Description</p>
            <input
              value={subtitleInput}
              onChange={(e) => setSubtitleInput(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-xl px-3 py-3 text-base outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
