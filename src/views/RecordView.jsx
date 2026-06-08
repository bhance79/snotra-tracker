import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ROUTINE_GROUPS } from '../data/routines'
import {
  getLastRoutineId,
  getCustomRoutines,
  saveCustomRoutine,
  deleteCustomRoutine,
  getHiddenRoutineIds,
  hideRoutineId,
} from '../data/storage'
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
  const [customRoutines, setCustomRoutines] = useState(() => getCustomRoutines())
  const [hiddenIds, setHiddenIds] = useState(() => getHiddenRoutineIds())
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [previewRoutine, setPreviewRoutine] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_PREVIEW_KEY) ?? 'null') }
    catch { return null }
  })
  const [recommendedId, setRecommendedId] = useState(null)
  const [navKey, setNavKey] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const addInputRef = useRef(null)
  const navDirRef = useRef('right')
  const previewDidNavigateRef = useRef(false)

  useEffect(() => {
    getLastRoutineId().then((lastId) => setRecommendedId(getRecommendedId(lastId)))
  }, [])

  useEffect(() => {
    if (previewRoutine) sessionStorage.setItem(SESSION_PREVIEW_KEY, JSON.stringify(previewRoutine))
    else sessionStorage.removeItem(SESSION_PREVIEW_KEY)
  }, [previewRoutine])

  useEffect(() => {
    if (showAddForm) {
      const t = setTimeout(() => addInputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [showAddForm])

  function go(fn, dir = 'right') {
    navDirRef.current = dir
    setNavKey((k) => k + 1)
    fn()
  }

  function exitEditMode() {
    setEditMode(false)
    setConfirmDeleteId(null)
    setShowAddForm(false)
    setAddName('')
  }

  function handleDeleteStatic(id) {
    hideRoutineId(id)
    setHiddenIds((prev) => new Set([...prev, id]))
    setConfirmDeleteId(null)
  }

  function handleDeleteCustom(id) {
    deleteCustomRoutine(id)
    setCustomRoutines((prev) => prev.filter((r) => r.id !== id))
    setConfirmDeleteId(null)
  }

  function handleAddRoutine() {
    if (!selectedGroup) return
    const groupCustoms = customRoutines.filter(
      (r) => r.groupId === selectedGroup.id || r.baseLabel === selectedGroup.label
    )
    const defaultName = `${selectedGroup.label} ${groupCustoms.length + 2}`
    const label = addName.trim() || defaultName

    const routine = {
      id: `custom-${Date.now()}`,
      label,
      baseLabel: selectedGroup.label,
      groupId: selectedGroup.id,
      subtitle: 'Custom · 0 exercises',
      isCustom: true,
      sections: [{ title: 'Exercises', exercises: [] }],
    }
    saveCustomRoutine(routine)
    setCustomRoutines((prev) => [...prev, routine])
    setAddName('')
    setShowAddForm(false)
  }

  const slideClass = navKey === 0 ? '' : (navDirRef.current === 'right' ? 'slide-from-right' : 'slide-from-left')

  const groupCustoms = selectedGroup
    ? customRoutines.filter((r) => r.groupId === selectedGroup.id || r.baseLabel === selectedGroup.label)
    : []

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
            <div className="flex-1 flex flex-col px-4 pb-2 overflow-y-auto safe-top">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => { go(() => setSelectedGroup(null), 'left'); exitEditMode() }}
                  className="flex items-center gap-2 text-zinc-400 active:text-white transition-colors -ml-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="text-lg font-medium">Choose your routine</span>
                </button>
                <button
                  onClick={() => { if (editMode) exitEditMode(); else setEditMode(true) }}
                  className="text-sm font-semibold text-brand-red active:text-red-400 transition-colors pr-1"
                >
                  {editMode ? 'Done' : 'Edit'}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                {/* Static variations */}
                {selectedGroup.variations
                  .filter((v) => !hiddenIds.has(v.id))
                  .map((v) => {
                    const override = getRoutineOverride(v.id)
                    const displayLabel = override?.label ?? v.label
                    const displaySubtitle = override?.subtitle ?? v.subtitle
                    const isConfirming = confirmDeleteId === v.id
                    return (
                      <div key={v.id} className="flex items-center gap-2">
                        {editMode && (
                          <button
                            onClick={() => setConfirmDeleteId(isConfirming ? null : v.id)}
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
                            <span className="text-white text-sm font-medium truncate mr-3">Delete "{displayLabel}"?</span>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm active:bg-zinc-700 transition-colors">Cancel</button>
                              <button onClick={() => handleDeleteStatic(v.id)} className="px-3 py-1.5 rounded-xl bg-brand-red text-white text-sm active:bg-brand-crimson transition-colors">Delete</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            disabled={editMode}
                            onClick={() => { previewDidNavigateRef.current = true; go(() => setPreviewRoutine(v), 'right') }}
                            className="flex-1 flex items-center justify-between px-4 py-5 rounded-2xl text-left bg-brand-card border border-white/10 text-white active:bg-brand-black transition-colors disabled:active:bg-brand-card"
                          >
                            <div>
                              <span className="text-xl font-semibold leading-tight font-baskerville">{displayLabel}</span>
                              {displaySubtitle && (
                                <div className="text-sm mt-0.5 text-zinc-400">{displaySubtitle}</div>
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    )
                  })}

                {/* Custom variations */}
                {groupCustoms.map((r) => {
                  const isConfirming = confirmDeleteId === r.id
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      {editMode && (
                        <button
                          onClick={() => setConfirmDeleteId(isConfirming ? null : r.id)}
                          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-brand-red active:bg-brand-red/10 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      )}
                      {isConfirming ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-3.5 rounded-2xl bg-brand-card border border-white/10">
                          <span className="text-white text-sm font-medium truncate mr-3">Delete "{r.label}"?</span>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm active:bg-zinc-700 transition-colors">Cancel</button>
                            <button onClick={() => handleDeleteCustom(r.id)} className="px-3 py-1.5 rounded-xl bg-brand-red text-white text-sm active:bg-brand-crimson transition-colors">Delete</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          disabled={editMode}
                          onClick={() => { previewDidNavigateRef.current = true; go(() => setPreviewRoutine(r), 'right') }}
                          className="flex-1 flex items-center justify-between px-4 py-5 rounded-2xl text-left bg-brand-card border border-white/10 text-white active:bg-brand-black transition-colors disabled:active:bg-brand-card"
                        >
                          <div>
                            <span className="text-xl font-semibold leading-tight font-baskerville">{r.label}</span>
                            {r.subtitle && (
                              <div className="text-sm mt-0.5 text-zinc-400">{r.subtitle}</div>
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Add Workout — visible in edit mode */}
                {editMode && (
                  showAddForm ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand-card border border-dashed border-zinc-600 mt-1">
                      <input
                        ref={addInputRef}
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRoutine()}
                        placeholder={`${selectedGroup.label} ${groupCustoms.length + 2}`}
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600"
                        style={{ fontSize: '16px' }}
                      />
                      <button onClick={() => { setShowAddForm(false); setAddName('') }} className="text-zinc-500 active:text-white text-sm transition-colors">Cancel</button>
                      <button onClick={handleAddRoutine} className="text-brand-red active:text-red-400 text-sm font-semibold transition-colors ml-1">Add</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 active:bg-zinc-800/30 transition-colors mt-1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="text-sm font-medium">Add Workout</span>
                    </button>
                  )
                )}
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
