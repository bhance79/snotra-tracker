import { useState, useEffect } from 'react'
import { ROUTINES } from '../data/routines'
import { getLastRoutineId } from '../data/storage'
import RoutinePreviewSheet from './RoutinePreviewSheet'

const SEQUENCE = ['push', 'pull', 'lower-quad', 'upper', 'lower-hinge']

function getRecommendedId(lastId) {
  if (!lastId) return null
  const idx = SEQUENCE.indexOf(lastId)
  if (idx === -1) return null
  return SEQUENCE[(idx + 1) % SEQUENCE.length]
}

export default function RecordView({ onSessionStart }) {
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [recommendedId, setRecommendedId] = useState(null)

  useEffect(() => {
    getLastRoutineId().then((lastId) => setRecommendedId(getRecommendedId(lastId)))
  }, [])

  const routine = ROUTINES.find((r) => r.id === selectedRoutine)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden safe-top">
        <h2 className="text-lg font-semibold text-white mb-3">Choose your routine</h2>

        <div className="flex flex-col gap-1.5 mb-3">
          {ROUTINES.map((r, i) => (
            <button
              key={r.id}
              style={i === 3 ? { marginTop: '0.5rem' } : undefined}
              onClick={() => setSelectedRoutine(selectedRoutine === r.id ? null : r.id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-left transition-colors ${
                selectedRoutine === r.id
                  ? 'bg-brand-red text-white'
                  : 'bg-zinc-800 text-white active:bg-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold leading-tight">{r.label}</span>
                  {r.id === recommendedId && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedRoutine === r.id ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      Recommended
                    </span>
                  )}
                </div>
                {r.subtitle && (
                  <div className={`text-sm mt-0.5 ${selectedRoutine === r.id ? 'text-white/70' : 'text-zinc-400'}`}>
                    {r.subtitle}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 rounded-2xl border border-zinc-800 p-3 overflow-hidden">
          {routine && (
            <div className="flex flex-wrap gap-1.5">
              {routine.exercises.map((ex) => (
                <span key={ex} className="text-sm bg-zinc-800 text-brand-silver px-2.5 py-1 rounded-full">
                  {ex}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-4 pt-3 pb-4 shrink-0">
        <button
          disabled={!selectedRoutine}
          onClick={() => selectedRoutine && setPreviewOpen(true)}
          className={`flex-1 py-3.5 rounded-2xl font-semibold text-base transition-colors ${
            selectedRoutine ? 'bg-zinc-800 text-white active:bg-zinc-700' : 'bg-zinc-800 text-zinc-600'
          }`}
        >
          Preview
        </button>
        <button
          disabled={!selectedRoutine}
          onClick={() => routine && onSessionStart(routine)}
          className={`flex-1 py-3.5 rounded-2xl font-semibold text-base transition-colors ${
            selectedRoutine ? 'bg-brand-red text-white active:bg-brand-crimson' : 'bg-zinc-800 text-zinc-600'
          }`}
        >
          Start
        </button>
      </div>

      <RoutinePreviewSheet
        routine={routine}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
