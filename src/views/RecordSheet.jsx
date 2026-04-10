import { useState, useEffect } from 'react'
import { ROUTINES } from '../data/routines'
import RoutinePreviewSheet from './RoutinePreviewSheet'

export default function RecordSheet({ open, onClose, onSessionStart }) {
  const [visible, setVisible] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      setSelectedRoutine(null)
      setPreviewOpen(false)
    }
  }, [open])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!open) return null

  const routine = ROUTINES.find((r) => r.id === selectedRoutine)

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div
        className={`pointer-events-auto flex flex-col bg-brand-black transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '100%' }}
      >
        {/* Dismiss */}
        <div className="flex justify-start pb-1 px-4 shrink-0 safe-top">
          <button onClick={handleClose} className="text-brand-silver active:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Content — no scroll needed */}
        <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-3">Choose your routine</h2>

          {/* Routine cards */}
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
                  <div className="text-xl font-semibold leading-tight">{r.label}</div>
                  {r.subtitle && (
                    <div className={`text-sm mt-0.5 ${selectedRoutine === r.id ? 'text-white/70' : 'text-zinc-400'}`}>
                      {r.subtitle}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Preview area */}
          <div className="flex-1 rounded-2xl border border-zinc-800 p-3 overflow-hidden">
            {routine ? (
              <div className="flex flex-wrap gap-1.5">
                {routine.exercises.map((ex) => (
                  <span key={ex} className="text-sm bg-zinc-800 text-brand-silver px-2.5 py-1 rounded-full">
                    {ex}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="bg-brand-black border-t border-zinc-800 rounded-t-2xl flex gap-3 px-4 pt-3 pb-8 shrink-0">
          <button
            disabled={!selectedRoutine}
            onClick={() => selectedRoutine && setPreviewOpen(true)}
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-base transition-colors ${
              selectedRoutine
                ? 'bg-zinc-800 text-white active:bg-zinc-700'
                : 'bg-zinc-800 text-zinc-600'
            }`}
          >
            Preview
          </button>
          <button
            disabled={!selectedRoutine}
            onClick={() => routine && onSessionStart(routine)}
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-base transition-colors ${
              selectedRoutine
                ? 'bg-brand-red text-white active:bg-brand-crimson'
                : 'bg-zinc-800 text-zinc-600'
            }`}
          >
            Start
          </button>
        </div>
      </div>

      <RoutinePreviewSheet
        routine={routine}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
