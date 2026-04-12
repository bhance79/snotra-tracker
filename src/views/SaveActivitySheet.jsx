import { useState, useEffect } from 'react'

function RatingSummary({ value }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((l) => (
        <div key={l} className={`w-6 h-6 rounded-md ${l <= value ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
      ))}
    </div>
  )
}

export default function SaveActivitySheet({ open, routine, exercises, cardStates, onResume, onSave, onDiscard }) {
  const [visible, setVisible] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setNotes('')
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open || !routine) return null

  return (
    <div className="absolute inset-0 z-80 flex flex-col justify-end pointer-events-none">
      <div
        className={`pointer-events-auto flex flex-col bg-brand-black transition-transform duration-300 ease-out`}
        style={{ height: '100%', transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0 safe-top">
          <button
            onClick={() => { setVisible(false); setTimeout(onResume, 300) }}
            className="text-brand-silver active:text-white transition-colors text-sm font-medium px-1">
            Resume
          </button>
          <span className="text-xl text-white font-semibold">Save Activity</span>
          <div className="w-16" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Routine title */}
          <h1 className="text-4xl font-bold text-white mt-4 mb-4">{routine.label} Workout</h1>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How'd it go? Share more about your activity"
            className="w-full bg-zinc-900 text-white text-sm rounded-2xl px-4 py-3 mb-4 outline-none placeholder-zinc-600 resize-none border border-zinc-800 focus:border-zinc-600 transition-colors"
            rows={4}
            style={{ fontSize: '16px' }}
          />

          {/* Exercise summaries */}
          <div className="flex flex-col gap-3">
            {exercises.map((ex, i) => {
              const state = cardStates[i]
              if (!state) return null
              const filledSets = state.sets.filter((s) => s.reps || s.weight)
              if (filledSets.length === 0) return null
              return (
                <div key={ex.name} className="bg-zinc-900 rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-white font-bold text-lg leading-tight">{ex.name}</div>
                      <div className="text-zinc-500 text-sm mt-0.5">{ex.setsReps}</div>
                    </div>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-[28px_1fr_1fr_auto] gap-x-2 mt-3 mb-1 px-1">
                    <span className="text-zinc-500 text-xs font-medium">Set</span>
                    <span className="text-zinc-500 text-xs font-medium">Reps</span>
                    <span className="text-zinc-500 text-xs font-medium">Weight</span>
                    <span className="text-zinc-500 text-xs font-medium">Rating</span>
                  </div>

                  {/* Set rows */}
                  <div className="flex flex-col gap-2">
                    {state.sets.map((s, j) => (
                      <div key={j} className="grid grid-cols-[28px_1fr_1fr_auto] gap-x-2 items-center px-1">
                        <span className="text-zinc-500 text-sm text-center">{j + 1}</span>
                        <span className="text-white text-sm text-center bg-zinc-800 rounded-lg py-1.5">
                          {s.reps || '—'}
                        </span>
                        <span className="text-white text-sm text-center bg-zinc-800 rounded-lg py-1.5">
                          {s.weight ? `${s.weight}lbs` : '—'}
                        </span>
                        <RatingSummary value={s.rating} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Discard */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure?\n\nDiscarding this activity will erase it permanently.')) {
                onDiscard()
              }
            }}
            className="w-full mt-6 mb-2 py-3 text-brand-red font-semibold text-base active:opacity-60 transition-opacity"
          >
            Discard Activity
          </button>
        </div>

        {/* Save button */}
        <div className="px-4 pt-3 pb-8 shrink-0">
          <button
            onClick={() => onSave(notes)}
            className="w-full py-4 rounded-2xl bg-brand-red text-white font-semibold text-base active:bg-brand-crimson transition-colors"
          >
            Save Activity
          </button>
        </div>
      </div>
    </div>
  )
}
