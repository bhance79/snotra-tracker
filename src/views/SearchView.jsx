import { useState, useEffect, useRef } from 'react'
import { MUSCLE_COLORS } from '../data/routines'
import { EXERCISE_LIBRARY, ALL_MUSCLES } from '../data/exercises'

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
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 mb-2">
      {/* Name */}
      <div className="text-white font-semibold text-base mb-2">
        {highlight(exercise.name, query)}
      </div>

      {/* Muscle tags */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {exercise.muscles.map((m) => (
          <span
            key={m}
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              MUSCLE_COLORS[m] || 'bg-zinc-700 text-white'
            }`}
          >
            {m}
          </span>
        ))}
      </div>

      {/* Meta row — tier · lift type · pattern · equipment */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TIER_STYLES[exercise.tier]}`}>
          T{exercise.tier}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIFT_TYPE_COLORS[exercise.liftType] ?? 'bg-zinc-800 text-zinc-400'}`}>
          {exercise.liftType}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PATTERN_COLORS[exercise.pattern] ?? 'bg-zinc-800 text-zinc-400'}`}>
          {exercise.pattern}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EQUIPMENT_COLORS[exercise.equipment.split('/')[0].trim()] ?? 'bg-zinc-800 text-zinc-400'}`}>
          {exercise.equipment}
        </span>
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

const CATEGORY_ORDER = ['Chest', 'Shoulders', 'Arms', 'Back', 'Legs', 'Calves', 'Core']

// Searching a parent term expands to include these categories
const CATEGORY_ALIASES = {
  'legs':  ['legs', 'calves'],
  'lower': ['legs', 'calves'],
  'upper': ['chest', 'shoulders', 'arms', 'back'],
  'arms':  ['arms'],
}

export default function SearchView() {
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)

  const q = query.trim()

  // Scroll to top whenever query changes
  useEffect(() => {
    containerRef.current?.parentElement?.scrollTo({ top: 0, behavior: 'instant' })
  }, [q])

  const filtered = q
    ? EXERCISE_LIBRARY.filter((ex) => {
        const lq = q.toLowerCase()
        const expandedCategories = CATEGORY_ALIASES[lq] ?? null
        return (
          ex.name.toLowerCase().includes(lq) ||
          ex.muscles.some((m) => m.toLowerCase().includes(lq)) ||
          (expandedCategories
            ? expandedCategories.includes(ex.category.toLowerCase())
            : ex.category.toLowerCase().includes(lq)) ||
          ex.pattern.toLowerCase().includes(lq) ||
          ex.equipment.toLowerCase().includes(lq)
        )
      })
    : EXERCISE_LIBRARY

  // Chips narrow to muscles that match query when typing
  const visibleChips = q
    ? ALL_MUSCLES.filter((m) => m.toLowerCase().includes(q.toLowerCase()))
    : ALL_MUSCLES

  const grouped = groupByCategory(filtered)

  return (
    <div ref={containerRef} className="flex flex-col pb-4">
      {/* Sticky header */}
      <div className="sticky top-0 bg-brand-black px-4 safe-top z-10">
        <h1 className="text-2xl font-bold text-white py-4 text-center">Library</h1>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-zinc-900 rounded-2xl px-4 py-3 mb-3 border border-zinc-800">
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
                    ? 'ring-2 ring-white/50 ' + (MUSCLE_COLORS[m] || 'bg-zinc-700 text-white')
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
            {filtered.map((ex) => (
              <ExerciseCard key={ex.name} exercise={ex} query={q} />
            ))}
          </>
        ) : (
          CATEGORY_ORDER.filter((cat) => grouped[cat]).map((cat) => (
            <div key={cat} className="mb-5">
              <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 px-1">
                {cat}
              </h2>
              {grouped[cat].map((ex) => (
                <ExerciseCard key={ex.name} exercise={ex} query="" />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
