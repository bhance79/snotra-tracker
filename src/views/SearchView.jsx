import { useState, useEffect, useRef } from 'react'
import { MUSCLE_COLORS } from '../data/routines'
import { EXERCISE_LIBRARY, ALL_MUSCLES } from '../data/exercises'
import {
  getCustomExercises,
  saveCustomExercise,
  deleteCustomExercise,
  getHiddenExerciseNames,
  hideExerciseName,
} from '../data/storage'
import ExerciseFormSheet from '../components/ExerciseFormSheet'

const TIER_STYLES = {
  1: 'bg-amber-400 text-black',
  2: 'bg-zinc-600 text-white',
  3: 'bg-zinc-800 text-zinc-400',
}

const LIFT_TYPE_COLORS = {
  'compound':  'bg-white text-black',
  'accessory': 'bg-zinc-600 text-white',
  'isolation': 'bg-zinc-800 text-zinc-400',
}

const PATTERN_COLORS = {
  'horizontal push':       'bg-blue-900 text-blue-300',
  'vertical push':         'bg-indigo-900 text-indigo-300',
  'horizontal pull':       'bg-green-900 text-green-300',
  'vertical pull':         'bg-teal-900 text-teal-300',
  'fly':                   'bg-pink-900 text-pink-300',
  'raise':                 'bg-rose-900 text-rose-300',
  'squat':                 'bg-lime-900 text-lime-300',
  'lunge':                 'bg-yellow-900 text-yellow-300',
  'hinge':                 'bg-orange-900 text-orange-300',
  'push':                  'bg-blue-900 text-blue-300',
  'curl':                  'bg-cyan-900 text-cyan-300',
  'extension':             'bg-violet-900 text-violet-300',
  'flexion':               'bg-purple-900 text-purple-300',
  'anti-extension':        'bg-slate-700 text-slate-300',
  'anti-lateral flexion':  'bg-stone-700 text-stone-300',
  'rotation':              'bg-amber-900 text-amber-300',
}

const EQUIPMENT_COLORS = {
  'barbell':          'bg-red-900 text-red-300',
  'dumbbell':         'bg-sky-900 text-sky-300',
  'machine':          'bg-zinc-700 text-zinc-300',
  'cable':            'bg-emerald-900 text-emerald-300',
  'bodyweight':       'bg-stone-700 text-stone-300',
  'plate':            'bg-yellow-900 text-yellow-300',
  'ball':             'bg-teal-900 text-teal-300',
}

const CATEGORY_ORDER = ['Chest', 'Shoulders', 'Arms', 'Back', 'Legs', 'Calves', 'Core']

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-brand-red">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

function ExerciseCard({ exercise, query }) {
  return (
    <div className="bg-brand-card rounded-2xl px-4 py-3">
      <div className="text-white font-semibold text-base mb-2">
        {highlight(exercise.name, query)}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {exercise.muscles.map((m) => (
          <span key={m} className={`text-xs px-2.5 py-1 rounded-full font-medium ${MUSCLE_COLORS[m] || 'bg-zinc-700 text-white'}`}>
            {m}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {exercise.tier != null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TIER_STYLES[exercise.tier] ?? 'bg-zinc-800 text-zinc-400'}`}>
            T{exercise.tier}
          </span>
        )}
        {exercise.liftType && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIFT_TYPE_COLORS[exercise.liftType] ?? 'bg-zinc-800 text-zinc-400'}`}>
            {exercise.liftType}
          </span>
        )}
        {exercise.pattern && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PATTERN_COLORS[exercise.pattern] ?? 'bg-zinc-800 text-zinc-400'}`}>
            {exercise.pattern}
          </span>
        )}
        {exercise.equipment && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EQUIPMENT_COLORS[exercise.equipment.split('/')[0].trim()] ?? 'bg-zinc-800 text-zinc-400'}`}>
            {exercise.equipment}
          </span>
        )}
        {exercise.isCustom && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-red/20 text-brand-red">custom</span>
        )}
      </div>
    </div>
  )
}

function groupByCategory(exercises) {
  const groups = {}
  for (const ex of exercises) {
    if (!groups[ex.category]) groups[ex.category] = []
    groups[ex.category].push(ex)
  }
  return groups
}

const CATEGORY_ALIASES = {
  'legs':  ['legs', 'calves'],
  'lower': ['legs', 'calves'],
  'upper': ['chest', 'shoulders', 'arms', 'back'],
  'arms':  ['arms'],
}

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [customExercises, setCustomExercises] = useState(() => getCustomExercises())
  const [hiddenNames, setHiddenNames] = useState(() => getHiddenExerciseNames())
  const [confirmDeleteName, setConfirmDeleteName] = useState(null)
  const [formExercise, setFormExercise] = useState(undefined) // undefined=closed, null=new, object=edit
  const containerRef = useRef(null)

  const q = query.trim()

  useEffect(() => {
    containerRef.current?.parentElement?.scrollTo({ top: 0, behavior: 'instant' })
  }, [q])

  // Merged library: custom exercises first, then static (minus hidden)
  const allExercises = [
    ...customExercises,
    ...EXERCISE_LIBRARY.filter((ex) => !hiddenNames.has(ex.name)),
  ]

  const filtered = q
    ? allExercises.filter((ex) => {
        const lq = q.toLowerCase()
        const expandedCategories = CATEGORY_ALIASES[lq] ?? null
        return (
          ex.name.toLowerCase().includes(lq) ||
          ex.muscles.some((m) => m.toLowerCase().includes(lq)) ||
          (expandedCategories
            ? expandedCategories.includes(ex.category.toLowerCase())
            : ex.category.toLowerCase().includes(lq)) ||
          ex.pattern?.toLowerCase().includes(lq) ||
          ex.equipment?.toLowerCase().includes(lq)
        )
      })
    : allExercises

  const visibleChips = q
    ? ALL_MUSCLES.filter((m) => m.toLowerCase().includes(q.toLowerCase()))
    : ALL_MUSCLES

  const grouped = groupByCategory(filtered)

  function exitEditMode() {
    setEditMode(false)
    setConfirmDeleteName(null)
  }

  function handleDelete(ex) {
    if (ex.isCustom) {
      deleteCustomExercise(ex.name)
      setCustomExercises((prev) => prev.filter((e) => e.name !== ex.name))
    } else {
      hideExerciseName(ex.name)
      setHiddenNames((prev) => new Set([...prev, ex.name]))
    }
    setConfirmDeleteName(null)
  }

  function handleSaveExercise(exercise) {
    const originalName = formExercise?.name
    const wasStatic = formExercise && !formExercise.isCustom

    if (wasStatic && originalName) {
      // Converting a static exercise — hide the original so it doesn't duplicate
      hideExerciseName(originalName)
      setHiddenNames((prev) => new Set([...prev, originalName]))
    } else if (originalName && originalName !== exercise.name) {
      // Renaming a custom exercise — remove the old entry
      deleteCustomExercise(originalName)
    }

    saveCustomExercise(exercise)
    setCustomExercises(getCustomExercises())
    setFormExercise(undefined)
  }

  function renderRow(ex) {
    const isConfirming = confirmDeleteName === ex.name
    return (
      <div key={ex.name} className="flex items-center gap-2 mb-2">
        {/* Centered minus button */}
        {editMode && (
          <button
            onClick={() => setConfirmDeleteName(isConfirming ? null : ex.name)}
            className="shrink-0 text-brand-red active:opacity-60 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="9" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        )}

        {isConfirming ? (
          <div className="flex-1 flex items-center justify-between px-4 py-3.5 rounded-2xl bg-brand-card border border-white/10">
            <span className="text-white text-sm font-medium truncate mr-3">Delete "{ex.name}"?</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirmDeleteName(null)} className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm active:bg-zinc-700 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(ex)} className="px-3 py-1.5 rounded-xl bg-brand-red text-white text-sm active:bg-brand-crimson transition-colors">Delete</button>
            </div>
          </div>
        ) : editMode ? (
          /* Any card in edit mode is tappable to open the edit form */
          <button
            className="flex-1 text-left active:opacity-70 transition-opacity rounded-2xl"
            onClick={() => setFormExercise(ex)}
          >
            <ExerciseCard exercise={ex} query={q} />
          </button>
        ) : (
          <div className="flex-1">
            <ExerciseCard exercise={ex} query={q} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative flex flex-col pb-4">
      {/* Sticky header */}
      <div className="sticky top-0 bg-brand-black px-4 safe-top z-10">
        <div className="flex items-center justify-between py-4">
          <div className="w-10" />
          <h1 className="text-2xl font-bold text-white font-baskerville">Library</h1>

          {/* Three-dot menu or Done button */}
          {editMode ? (
            <button
              onClick={exitEditMode}
              className="w-10 text-right text-sm font-semibold text-brand-red active:text-red-400 transition-colors"
            >
              Done
            </button>
          ) : (
            <div className="relative w-10 flex justify-end">
              {showHeaderMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setShowHeaderMenu(false)} />
              )}
              <button
                onClick={() => setShowHeaderMenu((v) => !v)}
                className="p-1 -mr-1 text-white/40 active:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 top-8 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                  <button
                    onClick={() => { setShowHeaderMenu(false); setEditMode(true) }}
                    className="w-full px-4 py-3.5 text-left text-white text-sm font-medium active:bg-zinc-800 transition-colors"
                  >
                    Edit and Remove
                  </button>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => { setShowHeaderMenu(false); setFormExercise(null) }}
                    className="w-full px-4 py-3.5 text-left text-white text-sm font-medium active:bg-zinc-800 transition-colors"
                  >
                    Add Exercise
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-brand-black rounded-2xl px-4 py-3 mb-3 border border-zinc-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            type="text"
            placeholder="Exercise, muscle, or equipment…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-zinc-600"
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

        {/* Muscle filter chips */}
        {visibleChips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {visibleChips.map((m) => (
              <button
                key={m}
                onClick={() => setQuery(query === m ? '' : m)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap shrink-0 transition-opacity active:opacity-70 ${
                  query === m
                    ? (MUSCLE_COLORS[m] || 'bg-zinc-700 text-white')
                    : MUSCLE_COLORS[m] || 'bg-zinc-700 text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 pt-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <p className="text-zinc-500 text-sm">No exercises found for "{q}"</p>
          </div>
        ) : q ? (
          <>
            <p className="text-zinc-500 text-xs mb-3">
              {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((ex) => renderRow(ex))}
          </>
        ) : (
          CATEGORY_ORDER.filter((cat) => grouped[cat]).map((cat) => (
            <div key={cat} className="mb-5">
              <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 px-1">
                {cat}
              </h2>
              {grouped[cat].map((ex) => renderRow(ex))}
            </div>
          ))
        )}

      </div>

      {/* Exercise form sheet */}
      {formExercise !== undefined && (
        <ExerciseFormSheet
          exercise={formExercise}
          onSave={handleSaveExercise}
          onClose={() => setFormExercise(undefined)}
          actionLabel={formExercise ? 'Save Changes' : 'Add to Library'}
        />
      )}
    </div>
  )
}
