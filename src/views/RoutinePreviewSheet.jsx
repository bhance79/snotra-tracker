import { useState, useEffect, useRef } from 'react'
import { MUSCLE_COLORS } from '../data/routines'

export default function RoutinePreviewSheet({ routine, open, onClose }) {
  const [visible, setVisible] = useState(false)
  const [dragY, setDragY] = useState(0)
  const scrollRef = useRef(null)
  const sheetRef = useRef(null)
  const dragStartY = useRef(null)
  const dragging = useRef(false)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      setDragY(0)
    }
  }, [open])

  function handleClose() {
    setVisible(false)
    setDragY(0)
    setTimeout(onClose, 300)
  }

  // All touch logic in a single non-passive native listener so preventDefault works
  useEffect(() => {
    const el = sheetRef.current
    if (!el || !open) return

    function onStart(e) {
      if (scrollRef.current?.scrollTop === 0) {
        dragStartY.current = e.touches[0].clientY
        dragging.current = true
      }
    }

    function onMove(e) {
      e.stopPropagation()
      if (!dragging.current) return
      const delta = e.touches[0].clientY - dragStartY.current
      if (delta > 0) {
        e.preventDefault()
        setDragY(delta)
      }
    }

    function onEnd(e) {
      e.stopPropagation()
      if (dragging.current) {
        // read latest dragY via functional update
        setDragY((dy) => {
          if (dy > 100) {
            setTimeout(() => {
              setVisible(false)
              setTimeout(onClose, 300)
            }, 0)
          }
          return dy > 100 ? dy : 0
        })
      }
      dragging.current = false
      dragStartY.current = null
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [open, onClose])

  if (!open || !routine) return null

  const translateStyle = visible
    ? { transform: `translateY(${dragY}px)`, transition: dragY > 0 ? 'none' : 'transform 0.3s ease-out' }
    : { transform: 'translateY(100%)', transition: 'transform 0.3s ease-out' }

  return (
    <div className="absolute inset-0 z-60 flex flex-col justify-end pointer-events-none">
      {/* Dimmed top strip — tapping it closes the preview sheet */}
      <div className="absolute inset-x-0 top-0 h-[8%] bg-black/40 pointer-events-auto" onClick={handleClose} />
      <div
        ref={sheetRef}
        className="pointer-events-auto flex flex-col bg-brand-black rounded-t-2xl"
        style={{ height: '92%', ...translateStyle }}
      >
        {/* Drag handle pill */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-600" />
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="mt-4 mb-6">
            <h1 className="text-4xl font-bold text-white">{routine.label} routine</h1>
            {routine.subtitle && (
              <p className="text-brand-silver text-sm mt-1">{routine.subtitle}</p>
            )}
          </div>

          {routine.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="text-base font-semibold text-brand-silver mb-3">
                {section.title}
              </h2>
              <div className="flex flex-col gap-3">
                {section.exercises.map((ex) => (
                  <div key={ex.name} className={`rounded-2xl px-4 py-4 border ${ex.selected ? 'bg-zinc-800 border-brand-red' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">{ex.name}</span>
                      </div>
                      <button className="text-zinc-500 active:text-white pl-3 pt-0.5 shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-brand-silver text-sm">{ex.setsReps}</p>
                    {ex.progression && (
                      <p className="text-zinc-600 text-xs mt-0.5 mb-3">{ex.progression}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {ex.muscles.map((m) => (
                        <span
                          key={m}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${MUSCLE_COLORS[m] ?? 'bg-zinc-600 text-white'}`}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
