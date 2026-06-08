import { useState, useEffect } from 'react'
import { ROUTINE_GROUPS } from '../data/routines'
import { getLastRoutineId } from '../data/storage'

const SEQUENCE = ['push', 'pull', 'lower-quad', 'upper', 'lower-hinge']

function getRecommendedId(lastId) {
  if (!lastId) return null
  const idx = SEQUENCE.indexOf(lastId)
  if (idx === -1) return null
  return SEQUENCE[(idx + 1) % SEQUENCE.length]
}

export default function RecordSheet({ open, onClose, onSessionStart }) {
  const [visible, setVisible] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [recommendedId, setRecommendedId] = useState(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
      getLastRoutineId().then((lastId) => setRecommendedId(getRecommendedId(lastId)))
    } else {
      setVisible(false)
      setSelectedGroup(null)
    }
  }, [open])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
      <div
        className={`pointer-events-auto flex flex-col bg-brand-black transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '100%' }}
      >
        <div className="flex justify-start pb-1 px-4 shrink-0 safe-top">
          <button onClick={handleClose} className="text-brand-silver active:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-5">
              <polyline points="2 8 16 18 30 8" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden">
          {selectedGroup ? (
            <>
              <button
                onClick={() => setSelectedGroup(null)}
                className="flex items-center gap-2 text-zinc-400 active:text-white transition-colors mb-3 -ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-lg font-medium">Choose your routine</span>
              </button>

              <div className="flex flex-col gap-1.5 mt-2">
                {selectedGroup.variations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => onSessionStart(v)}
                    className="flex items-center justify-between w-full px-4 py-5 rounded-2xl text-left bg-card border border-white/10 text-white active:bg-brand-black transition-colors"
                  >
                    <div>
                      <span className="text-xl font-semibold leading-tight font-baskerville">{v.label}</span>
                      {v.subtitle && (
                        <div className="text-sm mt-0.5 text-zinc-400">{v.subtitle}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-3 font-baskerville">Choose your routine</h2>

              <div className="flex flex-col gap-1.5">
                {ROUTINE_GROUPS.map((g, i) => (
                  <button
                    key={g.id}
                    style={i === 3 ? { marginTop: '0.5rem' } : undefined}
                    onClick={() => setSelectedGroup(g)}
                    className="flex items-center justify-between w-full px-4 py-5 rounded-2xl text-left bg-card border border-white/10 text-white active:bg-brand-black transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold leading-tight font-baskerville">{g.label}</span>
                        {g.id === recommendedId && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            Recommended
                          </span>
                        )}
                      </div>
                      {g.subtitle && (
                        <div className="text-sm mt-0.5 text-zinc-400">{g.subtitle}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
