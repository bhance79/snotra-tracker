import { supabase } from '../lib/supabase'

const LOCAL_KEY = 'snotra_workouts'

function getLocalWorkouts() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [] }
  catch { return [] }
}

export async function getWorkouts() {
  console.log('getWorkouts: fetching...')
  const session = await supabase.auth.getSession()
  console.log('getWorkouts: session =', session?.data?.session?.user?.email ?? 'not logged in')
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })
  console.log('getWorkouts result:', { data, error })
  if (error) {
    console.error('getWorkouts error:', error)
    return []
  }
  return data ?? []
}

export async function saveWorkout(workout) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('workouts')
    .insert({ ...workout, user_id: user.id })
  if (error) throw error
}

export async function getLastRoutineId() {
  const { data } = await supabase
    .from('workouts')
    .select('routine_id')
    .order('date', { ascending: false })
    .limit(1)
  return data?.[0]?.routine_id ?? null
}

export async function deleteWorkout(id) {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (error) throw error
}

// Called once after login — pushes any locally saved workouts to Supabase
export async function migrateLocalData() {
  const local = getLocalWorkouts()
  if (local.length === 0) return
  const { data: { user } } = await supabase.auth.getUser()
  const rows = local.map((w) => ({ ...w, user_id: user.id }))
  const { error } = await supabase.from('workouts').upsert(rows, { onConflict: 'id' })
  if (!error) localStorage.removeItem(LOCAL_KEY)
}
