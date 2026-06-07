import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ROUTINE_GROUPS } from '../data/routines'
import { getLastRoutineId } from '../data/storage'
import RoutinePreview, { getRoutineOverride } from './RoutinePreviewSheet'

const SEQUENCE = ['push', 'pull', 'lower-quad', 'upper', 'lower-hinge']

function getRecommendedId(lastId) {
  if (!lastId) return null
  const idx = SEQUENCE.indexOf(lastId)
  if (idx === -1) return null
  return SEQUENCE[(idx + 1) % SEQUENCE.length]
}

const SESSION_PREVIEW_KEY = 'snotra_preview_routine'

export default function RecordView({ onSessionStart }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [previewRoutine, setPreviewRoutine] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_PREVIEW_KEY) ?? 'null') }
    catch { return null }
  })
  const [recommendedId, setRecommendedId] = useState(null)
  const [navKey, setNavKey] = useState(0)
  const navDirRef = useRef('right')
  // true only when the user explicitly navigated into the preview this session;
  // false when it was restored from sessionStorage (returning from another tab)
  const previewDidNavigateRef = useRef(false)

  useEffect(() => {
    getLastRoutineId().then((lastId) => setRecommendedId(getRecommendedId(lastId)))
  }, [])

  useEffect(() => {
    if (previewRoutine) sessionStorage.setItem(SESSION_PREVIEW_KEY, JSON.stringify(previewRoutine))
    else sessionStorage.removeItem(SESSION_PREVIEW_KEY)
  }, [previewRoutine])

  function go(fn, dir = 'right') {
    navDirRef.current = dir
    setNavKey((k) => k + 1)
    fn()
  }

  const slideClass = navKey === 0 ? '' : (navDirRef.current === 'right' ? 'slide-from-right' : 'slide-from-left')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {previewRoutine && createPortal(
        <div className={`fixed inset-0 z-40 bg-brand-black flex flex-col ${previewDidNavigateRef.current ? 'slide-from-right' : ''}`}>
          <RoutinePreview
            routine={previewRoutine}
            onBack={() => {
              previewDidNavigateRef.current = false
              sessionStorage.removeItem(`snotra_pending_${previewRoutine.id}`)
              go(() => setPreviewRoutine(null), 'left')
            }}
            onStart={onSessionStart}
          />
        </div>,
        document.body
      )}

      {!previewRoutine && (
        <div key={navKey} className={`flex flex-col h-full ${slideClass}`}>
          {selectedGroup ? (
            <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden safe-top">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => go(() => setSelectedGroup(null), 'left')}
                  className="flex items-center gap-2 text-zinc-400 active:text-white transition-colors -ml-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="text-lg font-medium">Choose your routine</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                {selectedGroup.variations.map((v) => {
                  const override = getRoutineOverride(v.id)
                  const displayLabel = override?.label ?? v.label
                  const displaySubtitle = override?.subtitle ?? v.subtitle
                  return (
                    <button
                      key={v.id}
                      onClick={() => { previewDidNavigateRef.current = true; go(() => setPreviewRoutine(v), 'right') }}
                      className="flex items-center justify-between w-full px-4 py-5 rounded-2xl text-left bg-brand-card border border-white/10 text-white active:bg-brand-black transition-colors"
                    >
                      <div>
                        <span className="text-xl font-semibold leading-tight font-baskerville">{displayLabel}</span>
                        {displaySubtitle && (
                          <div className="text-sm mt-0.5 text-zinc-400">{displaySubtitle}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col px-4 pb-2 overflow-hidden safe-top pt-2">
              <h2 className="text-lg font-semibold text-white mb-6 font-baskerville">Choose your routine</h2>

              <div className="flex flex-col gap-1.5">
                {ROUTINE_GROUPS.map((g, i) => (
                  <button
                    key={g.id}
                    style={i === 3 ? { marginTop: '0.5rem' } : undefined}
                    onClick={() => go(() => setSelectedGroup(g), 'right')}
                    className="flex items-center justify-between w-full px-4 py-5 rounded-2xl text-left bg-brand-card border border-white/10 text-white active:bg-brand-black transition-colors"
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
