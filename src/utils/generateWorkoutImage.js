// Generates a transparent-background PNG of workout stats for social sharing

export async function generateWorkoutImage(workout) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const W = 600
  const PAD = 48
  const validExercises = workout.exercises.filter((e) => e.sets?.length > 0)

  // ── Pre-calculate height ───────────────────────────────────────────────────
  let h = PAD          // top padding
  h += 52              // title
  h += 28              // date
  h += 20              // gap before separator
  h += 1               // separator
  h += 28              // gap after separator

  if (workout.notes) {
    h += Math.ceil(workout.notes.length / 55) * 22 + 16
  }

  for (const ex of validExercises) {
    h += 28              // exercise name
    h += 22              // setsReps label
    h += 10              // gap
    h += ex.sets.length * 34
    h += 28              // gap between exercises
  }

  h += 1               // bottom separator
  h += 20              // gap
  h += 28              // branding
  h += PAD             // bottom padding

  canvas.width = W
  canvas.height = h

  // Fully transparent background
  ctx.clearRect(0, 0, W, h)

  let y = PAD

  // ── Title ──────────────────────────────────────────────────────────────────
  ctx.textAlign = 'left'
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,1)'
  ctx.fillText(`${(workout.routine_label ?? 'Workout').toUpperCase()} WORKOUT`, PAD, y + 34)
  y += 52

  // ── Date ───────────────────────────────────────────────────────────────────
  ctx.font = '15px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  const d = new Date(workout.date)
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  ctx.fillText(dateStr, PAD, y + 15)
  y += 28

  y += 20

  // ── Top separator ──────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  y += 28

  // ── Notes (if any) ─────────────────────────────────────────────────────────
  if (workout.notes) {
    ctx.font = 'italic 15px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    const words = workout.notes.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > W - PAD * 2) {
        ctx.fillText(line, PAD, y + 15)
        y += 22
        line = word
      } else {
        line = test
      }
    }
    if (line) { ctx.fillText(line, PAD, y + 15); y += 22 }
    y += 16
  }

  // ── Exercises ──────────────────────────────────────────────────────────────
  for (const ex of validExercises) {
    // Name
    ctx.textAlign = 'left'
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.fillText(ex.name, PAD, y + 18)
    y += 28

    // setsReps
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText(ex.setsReps ?? '', PAD, y + 13)
    y += 22

    y += 10

    // Set rows
    for (let i = 0; i < ex.sets.length; i++) {
      const s = ex.sets[i]
      const rowY = y + 16

      // Set number
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.textAlign = 'center'
      ctx.fillText(`${i + 1}`, PAD + 10, rowY)

      // Reps
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(s.reps ? `${s.reps} reps` : '—', PAD + 32, rowY)

      // Weight
      ctx.fillText(s.weight ? `${s.weight} lbs` : '—', PAD + 150, rowY)

      // Rating squares
      const dotX = PAD + 290
      for (let dot = 0; dot < 3; dot++) {
        ctx.beginPath()
        ctx.roundRect(dotX + dot * 16, rowY - 10, 11, 11, 2)
        ctx.fillStyle = dot < (s.rating ?? 0) ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)'
        ctx.fill()
      }

      y += 34
    }

    y += 28
  }

  // ── Bottom separator ───────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  y += 20

  // ── Branding ───────────────────────────────────────────────────────────────
  ctx.textAlign = 'left'
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('SNOTRA', PAD, y + 13)

  // ── Export ─────────────────────────────────────────────────────────────────
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
