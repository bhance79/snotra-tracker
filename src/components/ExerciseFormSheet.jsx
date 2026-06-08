import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MUSCLE_COLORS } from '../data/routines'
import { ALL_MUSCLES } from '../data/exercises'

const CATEGORIES = ['Chest', 'Shoulders', 'Arms', 'Back', 'Legs', 'Calves', 'Core']

export default function ExerciseFormSheet({ exercise, onSave, onClose, actionLabel = 'Add to Library' }) {
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState(exercise?.name ?? '')
  const [category, setCategory] = useState(exercise?.category ?? 'Back')
  const [muscles, setMuscles] = useState(exercise?.muscles ?? [])
  const [equipment, setEquipment] = useState(exercise?.equipment ?? '')
  const [sets, setSets] = useState(() => {
    if (exercise?.defaultSets) return String(exercise.defaultSets)
    const match = exercise?.defaultSetsReps?.match(/^(\d+)/)
    return match ? match[1] : '3'
  })
  const [reps, setReps] = useState(() => {
    if (exercise?.defaultReps) return String(exercise.defaultReps)
    const match = exercise?.defaultSetsReps?.match(/×\s*(\d+)/)
    return match ? match[1] : '10'
  })
  const nameRef = useRef(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  function dismiss() { setVisible(false); setTimeout(onClose, 280) }

  function toggleMuscle(m) {
    setMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  function handleSave() {
    const n = name.trim()
    if (!n) return
    const s = Math.max(1, parseInt(sets, 10) || 3)
    const r = Math.max(1, parseInt(reps, 10) || 10)
    onSave({
      name: n,
      category,
      muscles,
      equipment: equipment.trim(),
      pattern: exercise?.pattern ?? '',
      liftType: exercise?.liftType ?? 'accessory',
      tier: exercise?.tier ?? 3,
      defaultSets: s,
      defaultReps: r,
      defaultSetsReps: `${s} × ${r}`,
      isCustom: true,
    })
    dismiss()
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease-out' }}
        onClick={dismiss}
      />
      <div
        className="relative flex flex-col bg-zinc-950 rounded-t-2xl border-t border-zinc-800"
        style={{
          maxHeight: '88%',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s ease-out',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-zinc-800/60 flex items-center justify-between">
          <span className="text-white font-semibold text-base">{exercise ? 'Edit Exercise' : 'New Exercise'}</span>
          <button onClick={dismiss} className="text-zinc-500 active:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Incline Dumbbell Curl"
              className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red placeholder-zinc-600 border border-zinc-700"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Sets & Reps */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Sets</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red border border-zinc-700 text-center"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex items-end pb-3 text-zinc-600 font-semibold">×</div>
            <div className="flex-1">
              <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Reps</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red border border-zinc-700 text-center"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat ? 'bg-brand-red text-white' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Muscles */}
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Muscles</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MUSCLES.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMuscle(m)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-opacity ${
                    muscles.includes(m) ? 'opacity-100' : 'opacity-30'
                  } ${MUSCLE_COLORS[m] || 'bg-zinc-700 text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">Equipment</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. dumbbell, cable, barbell"
              className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red placeholder-zinc-600 border border-zinc-700"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        <div className="px-4 pt-3 pb-8 shrink-0 border-t border-zinc-800/60">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-full bg-brand-red text-white text-sm font-semibold active:bg-brand-crimson disabled:opacity-40 transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
