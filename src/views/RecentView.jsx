import { useState, useEffect } from 'react'
import { getWorkouts, deleteWorkout, getCustomRoutines, saveCustomRoutine } from '../data/storage'
import { generateWorkoutImage } from '../utils/generateWorkoutImage'
import { ROUTINE_GROUPS } from '../data/routines'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function buildRoutinePrescription(sets) {
  const filled = sets.filter((s) => s.reps)
  if (filled.length === 0) return '3 × 10'
  const n = filled.length
  const reps = filled[filled.length - 1].reps
  return `${n} × ${reps}`
}

function buildExerciseSummary(sets) {
  const filled = sets.filter((s) => s.reps || s.weight)
  if (filled.length === 0) return null
  const n = filled.length
  const last = filled[filled.length - 1]
  const parts = [`${n} set${n !== 1 ? 's' : ''}`]
  if (last.reps) parts.push(`× ${last.reps} reps`)
  if (last.weight) parts.push(`@ ${last.weight} lbs`)
  return parts.join(' ')
}

function lastRatingColor(sets) {
  const filled = sets.filter((s) => s.reps || s.weight)
  const rating = filled.length > 0 ? (filled[filled.length - 1].rating ?? 0) : 0
  if (rating === 2) return 'bg-yellow-400'
  if (rating === 1) return 'bg-brand-red'
  return 'bg-emerald-400'
}

function WorkoutCard({ workout, onDelete, onSaved }) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleSave() {
    setShowMenu(false)
    // "Pull A" → "Pull", "Push B" → "Push", "Pull" → "Pull"
    const baseLabel = workout.routine_label.replace(/\s+[A-Z]$/, '').trim()
    // Stable slug that survives label renames (e.g. "pull", "push")
    const parentGroup = ROUTINE_GROUPS.find((g) => g.label === baseLabel)
    const groupId = parentGroup?.id ?? baseLabel.toLowerCase().replace(/\s+/g, '-')

    const existing = getCustomRoutines().filter((r) => r.groupId === groupId)
    const number = existing.length + 2
    const label = `${baseLabel} ${number}`

    const routine = {
      id: `custom-${Date.now()}`,
      label,
      baseLabel,
      groupId,
      subtitle: `Custom · ${workout.exercises.filter((ex) => ex.sets?.length).length} exercises`,
      isCustom: true,
      sections: [{
        title: 'Exercises',
        exercises: workout.exercises
          .filter((ex) => ex.sets && ex.sets.length > 0)
          .map((ex) => ({
            name: ex.name,
            setsReps: buildRoutinePrescription(ex.sets),
            muscles: ex.muscles || [],
            selected: true,
          })),
      }],
    }

    saveCustomRoutine(routine)
    onSaved(label)
  }

  async function handleExport() {
    setShowMenu(false)
    try {
      const blob = await generateWorkoutImage(workout)
      const file = new File([blob], 'snotra-workout.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${workout.routine_label} Workout` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'snotra-workout.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteWorkout(workout.id)
    onDelete(workout.id)
  }

  const validExercises = workout.exercises.filter(
    (ex) => ex.sets && ex.sets.length > 0 && buildExerciseSummary(ex.sets)
  )

  return (
    <div className="relative bg-brand-card border border-white/10 rounded-2xl px-4 py-4 mb-4">
      {/* Dismiss menu on outside tap */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-zinc-500 text-xs mb-1.5">{formatDate(workout.date)}</p>
          <h2 className="text-2xl font-bold text-white leading-tight">
            {workout.routine_label} Workout
          </h2>
        </div>

        {/* Three-dot menu */}
        <div className="relative ml-3 shrink-0 z-20">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-1 -mr-1 mt-1 text-white/40 active:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <button
                onClick={handleSave}
                className="w-full px-4 py-3.5 text-left text-white text-sm font-medium active:bg-zinc-800 transition-colors"
              >
                Save as Routine
              </button>
              <div className="h-px bg-white/5" />
              <button
                onClick={handleExport}
                className="w-full px-4 py-3.5 text-left text-white text-sm font-medium active:bg-zinc-800 transition-colors"
              >
                Export
              </button>
              <div className="h-px bg-white/5" />
              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(true) }}
                className="w-full px-4 py-3.5 text-left text-brand-red text-sm font-medium active:bg-zinc-800 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {workout.notes ? (
        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{workout.notes}</p>
      ) : null}

      {/* Exercise rows */}
      {validExercises.length > 0 && (
        <div className="mt-3 flex flex-col divide-y divide-white/5">
          {validExercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between py-2.5">
              <div className="min-w-0 mr-3">
                <p className="text-white font-semibold text-lg leading-tight">{ex.name}</p>
                <p className="text-zinc-400 text-base mt-0.5">{buildExerciseSummary(ex.sets)}</p>
              </div>
              <div className={`w-7 h-7 rounded-lg shrink-0 ${lastRatingColor(ex.sets)}`} />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
          <span className="text-zinc-400 text-sm flex-1">Delete this workout?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium active:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-brand-red text-white text-sm font-semibold active:bg-brand-crimson transition-colors disabled:opacity-50"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function RecentView({ refreshKey }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savedLabel, setSavedLabel] = useState(null)

  useEffect(() => {
    setLoading(true)
    getWorkouts()
      .then((data) => setWorkouts(data || []))
      .catch((e) => { console.error(e); setWorkouts([]) })
      .finally(() => setLoading(false))
  }, [refreshKey])

  function handleSaved(label) {
    setSavedLabel(label)
    setTimeout(() => setSavedLabel(null), 2500)
  }

  return (
    <div className="flex flex-col pb-4">
      <div className="sticky top-0 bg-brand-black px-4 safe-top">
        <h1 className="text-2xl font-bold text-white py-4 text-center font-baskerville">Recents</h1>
      </div>

      <div className="px-4">
      {loading ? (
        <div className="flex justify-center mt-24">
          <div className="w-6 h-6 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <p className="text-zinc-500 text-sm">No workouts saved yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Finish a session to see it here.</p>
        </div>
      ) : (
        workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onDelete={(id) => setWorkouts((prev) => prev.filter((x) => x.id !== id))}
            onSaved={handleSaved}
          />
        ))
      )}
      </div>

      {savedLabel && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-white/10 text-white text-sm px-5 py-2.5 rounded-full shadow-2xl whitespace-nowrap">
          Saved as "{savedLabel}"
        </div>
      )}
    </div>
  )
}
