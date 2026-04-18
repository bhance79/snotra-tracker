import { useState, useEffect } from 'react'
import { getWorkouts, deleteWorkout } from '../data/storage'
import { generateWorkoutImage } from '../utils/generateWorkoutImage'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function RatingSummary({ value }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((l) => (
        <div key={l} className={`w-6 h-6 rounded-md ${l <= value ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
      ))}
    </div>
  )
}

function WorkoutCard({ workout, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await generateWorkoutImage(workout)
      const file = new File([blob], 'snotra-workout.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${workout.routine_label} Workout` })
      } else {
        // Fallback: trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'snotra-workout.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    } finally {
      setSharing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteWorkout(workout.id)
    onDelete(workout.id)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-bold text-white">{workout.routine_label} Workout</h2>
        <span className="text-zinc-500 text-[11px] mt-1 shrink-0 ml-3">{formatDate(workout.date)}</span>
      </div>

      {/* Notes */}
      {workout.notes ? (
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{workout.notes}</p>
      ) : null}

      {/* Exercises */}
      <div className="flex flex-col gap-5">
        {workout.exercises.map((ex) => {
          if (!ex.sets || ex.sets.length === 0) return null
          return (
            <div key={ex.name}>
              <div className="text-lg font-bold text-white mb-0.5">{ex.name}</div>
              <div className="text-zinc-500 text-sm mb-3">{ex.setsReps}</div>

              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_1fr_auto] gap-x-2 mb-2 px-1">
                <span className="text-zinc-500 text-xs font-medium">Set</span>
                <span className="text-zinc-500 text-xs font-medium">Reps</span>
                <span className="text-zinc-500 text-xs font-medium">Weight</span>
                <span className="text-zinc-500 text-xs font-medium">Rating</span>
              </div>

              <div className="flex flex-col gap-2">
                {ex.sets.map((s, j) => (
                  <div key={j} className="grid grid-cols-[32px_1fr_1fr_auto] gap-x-2 items-center px-1">
                    <span className="text-zinc-500 text-sm text-center">{j + 1}</span>
                    <span className="text-white text-sm text-center bg-zinc-800 rounded-lg py-1.5">{s.reps || '—'}</span>
                    <span className="text-white text-sm text-center bg-zinc-800 rounded-lg py-1.5">
                      {s.weight ? `${s.weight}lbs` : '—'}
                    </span>
                    <RatingSummary value={s.rating ?? 0} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-5 px-1">
        {confirmDelete ? (
          <div className="flex items-center gap-2 w-full">
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
        ) : (
          <>
            <button
              onClick={() => setLiked((v) => !v)}
              className="flex items-center gap-2 transition-colors active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                className={`w-7 h-7 transition-colors ${liked ? 'text-brand-red' : 'text-zinc-400'}`}>
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <button onClick={handleShare} disabled={sharing} className="text-zinc-400 active:text-white transition-colors active:scale-90 disabled:opacity-40">
                {sharing ? (
                  <div className="w-7 h-7 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                    className="w-7 h-7">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                )}
              </button>
              <button onClick={() => setConfirmDelete(true)} className="text-zinc-600 active:text-brand-red transition-colors active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                  className="w-6 h-6">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RecentView({ refreshKey }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWorkouts()
      .then((data) => setWorkouts(data || []))
      .catch((e) => { console.error(e); setWorkouts([]) })
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <div className="flex flex-col pb-4">
      <div className="sticky top-0 bg-brand-black px-4 safe-top">
        <h1 className="text-2xl font-bold text-white py-4 text-center">Recents</h1>
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
          />
        ))
      )}
      </div>
    </div>
  )
}
