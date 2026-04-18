function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function exerciseSummary(ex) {
  const completed = ex.sets.filter((s) => s.reps || s.weight)
  if (!completed.length) return null

  const numSets = completed.length

  // Most common reps
  const repsCounts = {}
  for (const s of completed) if (s.reps) repsCounts[s.reps] = (repsCounts[s.reps] || 0) + 1
  const reps = Object.entries(repsCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Most common weight
  const wtCounts = {}
  for (const s of completed) if (s.weight) wtCounts[s.weight] = (wtCounts[s.weight] || 0) + 1
  const weight = Object.entries(wtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  let label = `${ex.name}`
  if (reps) label += `  ${numSets}×${reps}`
  if (weight) label += ` @ ${weight} lbs`
  return label
}

async function loadCustomFont() {
  try {
    const font = new FontFace('CoveredByYourGrace-Regular', 'url(/fonts/CoveredByYourGrace-Regular.ttf)')
    await font.load()
    document.fonts.add(font)
  } catch (_) {}
}

export async function generateWorkoutImage(workout) {
  await loadCustomFont()
  const logo = await loadImage('/images/snotra-logo.png')

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const W = 500
  const PAD = 44
  const LINE_H = 32

  const validExercises = workout.exercises
    .map((ex) => exerciseSummary(ex))
    .filter(Boolean)

  // Logo dimensions (max 260px wide)
  const logoMaxW = 160
  const logoScale = logo ? Math.min(1, logoMaxW / logo.naturalWidth) : 0
  const logoW = logo ? logo.naturalWidth * logoScale : 0
  const logoH = logo ? logo.naturalHeight * logoScale : 0

  // Height calculation
  let h = PAD
  h += 32           // workout title
  h += 10           // gap before exercises
  h += validExercises.length * LINE_H
  h += 36           // gap before logo
  h += logoH
  h += PAD          // bottom padding

  canvas.width = W
  canvas.height = h

  ctx.clearRect(0, 0, W, h)

  let y = PAD

  // ── Workout title ──────────────────────────────────────────────────────────
  const title = `${workout.routine_label ?? 'Workout'} workout`
  ctx.textAlign = 'center'
  ctx.font = '20px "CoveredByYourGrace-Regular", cursive'
  ctx.fillStyle = 'rgba(255,255,255,1)'
  ctx.fillText(title, W / 2, y)
  y += 32

  y += 10

  // ── Exercise lines ─────────────────────────────────────────────────────────
  ctx.font = '20px "CoveredByYourGrace-Regular", cursive'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'

  for (const line of validExercises) {
    ctx.fillText(line, W / 2, y)
    y += LINE_H
  }

  y += 36

  // ── Logo (bottom center) ───────────────────────────────────────────────────
  if (logo) {
    ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH)
  }

  // ── Export ────────────────────────────────────────────────────────────────
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
