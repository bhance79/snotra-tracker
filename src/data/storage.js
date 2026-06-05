import { supabase } from '../lib/supabase'

// ─── Local fallback key (pre-auth workouts) ────────────────────────────────
const LOCAL_KEY = 'snotra_workouts'

function getLocalWorkouts() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [] }
  catch { return [] }
}

// ─── Internal: resolve exercise names → UUIDs ──────────────────────────────
// Bulk-looks up exercises by name in one query. Any name not found in the
// system library is inserted as a custom exercise for this user so no
// workout data is silently dropped during migration.

/**
 * @param {string[]} names
 * @returns {Promise<Map<string, string>>}
 */
async function resolveExerciseIds(names) {
  const unique = [...new Set(names)]
  if (unique.length === 0) return new Map()

  const { data: found } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', unique)

  const map = new Map()
  for (const row of found ?? []) {
    map.set(row.name, row.id)
  }

  const missing = unique.filter((n) => !map.has(n))
  if (missing.length > 0) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: inserted } = await supabase
      .from('exercises')
      .upsert(
        missing.map((name) => ({
          name,
          is_custom: true,
          created_by: user.id,
          muscles: [],
        })),
        { onConflict: 'name,created_by' }
      )
      .select('id, name')
    for (const row of inserted ?? []) {
      map.set(row.name, row.id)
    }
  }

  return map
}

// ─── saveWorkout ───────────────────────────────────────────────────────────
// Inserts one workout row, one workout_exercises row per exercise, and all
// workout_sets in three bulk queries.
//
// NOTE: Supabase has no client-side transaction API. The three inserts run
// sequentially. If the sets insert fails after exercises insert, the
// workout_exercises rows will be orphaned (no sets). getWorkoutHistory
// filters those out via `filter(ex => ex.sets.length > 0)`. For true
// atomicity, wrap this logic in a Postgres function called via supabase.rpc().
//
// @param {{
//   routineLabel: string,
//   routineSlug?: string,
//   notes?: string,
//   exercises: Array<{name:string, setsReps:string, muscles:string[], sets:Array<{reps:string|number, weight:string|number, rating:number}>}>,
//   startedAt?: string|null,
// }} input
// @returns {Promise<string>} new workout UUID

export async function saveWorkout(input) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const completedAt = new Date().toISOString()
  const startedAt = input.startedAt
    ? new Date(Number(input.startedAt)).toISOString()
    : completedAt

  const exerciseIdMap = await resolveExerciseIds(
    input.exercises.map((e) => e.name)
  )

  // Step 1 — workout row
  const { data: workout, error: workoutErr } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      routine_label: input.routineLabel,
      started_at: startedAt,
      completed_at: completedAt,
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (workoutErr) throw workoutErr
  const workoutId = workout.id

  // Step 2 — workout_exercises (all at once)
  const exerciseRows = input.exercises.map((ex, i) => ({
    workout_id: workoutId,
    exercise_id: exerciseIdMap.get(ex.name) ?? null,
    order_index: i,
    actual_sets_reps: ex.setsReps || null,
  }))

  const { data: insertedExercises, error: exErr } = await supabase
    .from('workout_exercises')
    .insert(exerciseRows)
    .select('id, order_index')

  if (exErr) throw exErr

  const weIdByIndex = new Map(
    (insertedExercises ?? []).map((row) => [row.order_index, row.id])
  )

  // Step 3 — workout_sets (all exercises in one bulk insert)
  const setRows = input.exercises.flatMap((ex, exerciseIndex) => {
    const workoutExerciseId = weIdByIndex.get(exerciseIndex)
    if (!workoutExerciseId) return []
    return ex.sets
      .filter((s) => s.reps !== '' || s.weight !== '')
      .map((s, setIndex) => ({
        workout_exercise_id: workoutExerciseId,
        set_number: setIndex + 1,
        reps: s.reps !== '' && s.reps != null ? Number(s.reps) : null,
        weight: s.weight !== '' && s.weight != null ? Number(s.weight) : null,
        weight_unit: 'lbs',          // TODO: read from profiles.preferred_weight_unit
        rating: s.rating ?? 0,
        completed: true,
      }))
  })

  if (setRows.length > 0) {
    const { error: setsErr } = await supabase
      .from('workout_sets')
      .insert(setRows)
    if (setsErr) throw setsErr
  }

  return workoutId
}

// ─── completeWorkout ───────────────────────────────────────────────────────
// Saves the workout and clears the active session atomically from the
// caller's perspective. Use this instead of calling saveWorkout +
// clearActiveWorkout separately.
//
// The active workout clear is intentionally non-fatal: a network hiccup
// after a successful save should never surface as an error to the user.
// The stale active_workouts row will be ignored on next app load because
// no matching localStorage session exists.
//
// @param {Parameters<typeof saveWorkout>[0] & { startedAt?: string|null }} input
// @returns {Promise<string>} new workout UUID

export async function completeWorkout(input) {
  const workoutId = await saveWorkout(input)
  await clearActiveWorkout().catch((err) =>
    console.warn('[snotra] clearActiveWorkout failed after save:', err)
  )
  return workoutId
}

// ─── getWorkoutHistory ─────────────────────────────────────────────────────
// Returns workouts ordered by completion date, in the shape that
// RecentView and generateWorkoutImage expect. The `date` field is an alias
// for `completed_at` to preserve backward compatibility.
//
// @param {number} [limit=30]
// @returns {Promise<Array>}

export async function getWorkoutHistory(limit = 30) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      routine_label,
      completed_at,
      started_at,
      duration_seconds,
      notes,
      workout_exercises (
        id,
        order_index,
        actual_sets_reps,
        exercises (
          id,
          name,
          muscles
        ),
        workout_sets (
          set_number,
          reps,
          weight,
          weight_unit,
          rating
        )
      )
    `)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((w) => {
    const sortedExercises = [...(w.workout_exercises ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    )
    return {
      id: w.id,
      routine_label: w.routine_label ?? '',
      date: w.completed_at,          // backward-compat alias
      started_at: w.started_at ?? '',
      duration_seconds: w.duration_seconds ?? null,
      notes: w.notes ?? '',
      exercises: sortedExercises
        .map((we) => ({
          name: we.exercises?.name ?? '',
          setsReps: we.actual_sets_reps ?? '',
          muscles: we.exercises?.muscles ?? [],
          sets: [...(we.workout_sets ?? [])]
            .sort((a, b) => a.set_number - b.set_number)
            .map((s) => ({
              reps: s.reps ?? '',
              weight: s.weight ?? '',
              rating: s.rating ?? 0,
            })),
        }))
        .filter((ex) => ex.sets.length > 0),
    }
  })
}

// Backward-compatible alias — RecentView still imports getWorkouts
export const getWorkouts = getWorkoutHistory

// ─── getExerciseHistory ────────────────────────────────────────────────────
// Accepts a UUID (fast path) or a name string (resolves to UUID first).
// Returns up to `limit` past sessions for one exercise, newest first.
//
// Why this replaces the old implementation:
//   Old: fetches 50 complete workout rows, then filters in JS — O(workouts × exercises)
//   New: queries workout_exercises for a single exercise_id — O(sessions for that exercise)
//
// Falls back to empty array when the exercise isn't in the DB yet (e.g.
// exercise library seeding hasn't run). The archives sheet handles this by
// showing "No history yet".
//
// @param {string} exerciseIdOrName - UUID or display name
// @param {number} [limit=15]
// @returns {Promise<Array<{date: string, exercise: {sets: Array}}>>}

export async function getExerciseHistory(exerciseIdOrName, limit = 15) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let exerciseId = exerciseIdOrName

  if (!uuidRe.test(exerciseIdOrName)) {
    const { data } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exerciseIdOrName)
      .maybeSingle()
    if (!data) return []
    exerciseId = data.id
  }

  // Join workout_exercises → workout_sets (children) and workouts (parent)
  // RLS on workout_exercises already restricts to this user's rows.
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      workout_sets (
        set_number,
        reps,
        weight,
        weight_unit,
        rating
      ),
      workouts!inner (
        completed_at
      )
    `)
    .eq('exercise_id', exerciseId)
    .not('workouts.completed_at', 'is', null)

  if (error) throw error

  return (data ?? [])
    .map((we) => ({
      // workouts is a single object here (many-to-one FK), not an array
      completedAt: we.workouts?.completed_at ?? '',
      sets: [...(we.workout_sets ?? [])]
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          reps: s.reps ?? '',
          weight: s.weight ?? '',
          rating: s.rating ?? 0,
        })),
    }))
    .filter((e) => e.sets.length > 0)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limit)
    .map((e) => ({
      date: e.completedAt,
      exercise: { sets: e.sets },
    }))
}

// ─── saveActiveWorkout ─────────────────────────────────────────────────────
// Upserts the in-progress session (debounced to every 4s in WorkoutSession).
// One row per user; onConflict replaces. Non-throwing: if this fails the
// localStorage copy is the primary recovery path.
//
// @param {{
//   routineId: string,
//   routine: object,
//   exercises: object[],
//   cardStates: object[],
//   activeExercise: number,
//   startedAt: string|null,
// }} sessionData

export async function saveActiveWorkout(sessionData) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  await supabase
    .from('active_workouts')
    .upsert(
      {
        user_id: session.user.id,
        routine_id: null,              // FK populated once routines migrate to DB
        routine_data: sessionData.routine,
        exercises: sessionData.exercises,
        card_states: sessionData.cardStates,
        active_exercise: sessionData.activeExercise ?? 0,
        started_at: sessionData.startedAt
          ? new Date(Number(sessionData.startedAt)).toISOString()
          : new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
}

// Backward-compatible alias — WorkoutSession still calls saveActiveSession
export const saveActiveSession = saveActiveWorkout

// ─── getActiveWorkout ──────────────────────────────────────────────────────
// Called on app load. Returns the cloud-backed session if localStorage was
// cleared by iOS under memory pressure. Returns null if no active session.
//
// @returns {Promise<{routineId:string, routine:object, exercises:object[], cardStates:object[], activeExercise:number, startedAt:string|null}|null>}

export async function getActiveWorkout() {
  const { data } = await supabase
    .from('active_workouts')
    .select('*')
    .maybeSingle()

  if (!data) return null

  // routine_data.id is the static slug ('push', 'pull', etc.)
  // routineId must match routine.id for WorkoutSession's session-restore check
  const routineSlug = data.routine_data?.id ?? ''

  return {
    routineId: routineSlug,
    routine: data.routine_data,
    exercises: data.exercises,
    cardStates: data.card_states,
    activeExercise: data.active_exercise ?? 0,
    startedAt: data.started_at
      ? String(new Date(data.started_at).getTime())
      : null,
  }
}

// Backward-compatible alias — App.jsx still calls getActiveSession
export const getActiveSession = getActiveWorkout

// ─── clearActiveWorkout ────────────────────────────────────────────────────

export async function clearActiveWorkout() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  await supabase
    .from('active_workouts')
    .delete()
    .eq('user_id', session.user.id)
}

// Backward-compatible alias — App.jsx still calls clearActiveSession
export const clearActiveSession = clearActiveWorkout

// ─── deleteWorkout ─────────────────────────────────────────────────────────
// Cascading deletes on workout_exercises and workout_sets are handled by the
// database FK constraints, so only the parent row needs to be targeted.

export async function deleteWorkout(id) {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (error) throw error
}

// ─── getLastRoutineId ──────────────────────────────────────────────────────
// Returns the routine slug ('push', 'pull', etc.) for the most recent
// completed workout. Used by RecordSheet to recommend the next routine.
//
// The new schema stores routine_label ('Push', 'Pull') rather than the slug.
// Until routines migrate to their own table with a proper FK, this derives
// the slug from the label via a static mapping.

const LABEL_TO_SLUG = {
  'Push':  'push',
  'Pull':  'pull',
  'Legs':  'lower-quad',
  'Upper': 'upper',
  'Lower': 'lower-hinge',
}

export async function getLastRoutineId() {
  const { data } = await supabase
    .from('workouts')
    .select('routine_label')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
  const label = data?.[0]?.routine_label ?? null
  return label ? (LABEL_TO_SLUG[label] ?? null) : null
}

// ─── migrateLocalData ──────────────────────────────────────────────────────
// Called once on first login. Pushes any pre-auth localStorage workouts into
// the new normalized schema. Each workout is migrated independently so a
// single failure doesn't block the rest.

export async function migrateLocalData() {
  const local = getLocalWorkouts()
  if (local.length === 0) return

  for (const w of local) {
    try {
      await saveWorkout({
        routineLabel: w.routine_label ?? '',
        routineSlug: w.routine_id ?? null,
        notes: w.notes ?? '',
        exercises: (w.exercises ?? []).map((ex) => ({
          name: ex.name ?? '',
          setsReps: ex.setsReps ?? '',
          muscles: ex.muscles ?? [],
          sets: ex.sets ?? [],
        })),
        // Use the original workout date as both started_at and completed_at
        // since the old schema had a single `date` field.
        startedAt: w.date ? String(new Date(w.date).getTime()) : null,
      })
    } catch (err) {
      console.warn('[snotra] migration failed for workout', w.id, err)
    }
  }

  localStorage.removeItem(LOCAL_KEY)
}
