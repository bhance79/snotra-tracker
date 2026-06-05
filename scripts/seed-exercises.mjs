/**
 * Exercise library seed script.
 *
 * Inserts (or updates) all system exercises from src/data/exercises.js into the
 * Supabase exercises table. Safe to run multiple times — existing exercises are
 * updated in place (their UUIDs are preserved), new ones are inserted.
 *
 * Requires the SERVICE ROLE key (bypasses RLS). Never the anon key.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> node scripts/seed-exercises.mjs
 *
 * Find your service role key:
 *   Supabase Dashboard → Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js'
import { EXERCISE_LIBRARY } from '../src/data/exercises.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://egkzocbacvkibevteuqf.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('\n[seed] ✗ Missing SUPABASE_SERVICE_KEY\n')
  console.error('       Set it before running:')
  console.error('       SUPABASE_SERVICE_KEY=<key> node scripts/seed-exercises.mjs\n')
  console.error('       Find it in: Supabase Dashboard → Settings → API → service_role\n')
  process.exit(1)
}

// Service role key bypasses RLS — appropriate for seeding system records
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exerciseToRow(ex) {
  return {
    name:             ex.name,
    muscles:          ex.muscles,
    category:         ex.category,
    movement_pattern: ex.pattern,
    lift_type:        ex.liftType,
    tier:             ex.tier,
    equipment:        ex.equipment,
    is_custom:        false,
    created_by:       null,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n[seed] Starting exercise library seed`)
  console.log(`[seed] Source: ${EXERCISE_LIBRARY.length} exercises in exercises.js\n`)

  // 1. Load all current system exercises so we can diff
  const { data: existing, error: fetchErr } = await supabase
    .from('exercises')
    .select('id, name')
    .is('created_by', null)

  if (fetchErr) {
    throw new Error(`Failed to fetch existing exercises: ${fetchErr.message}`)
  }

  const existingByName = new Map((existing ?? []).map((e) => [e.name, e.id]))
  console.log(`[seed] Found ${existingByName.size} existing system exercises in database`)

  // 2. Partition into inserts vs updates
  const toInsert = []
  const toUpdate = []

  for (const ex of EXERCISE_LIBRARY) {
    const row = exerciseToRow(ex)
    if (existingByName.has(ex.name)) {
      toUpdate.push({ ...row, id: existingByName.get(ex.name) })
    } else {
      toInsert.push(row)
    }
  }

  console.log(`[seed] Plan: ${toInsert.length} to insert, ${toUpdate.length} to update\n`)

  // 3. Bulk insert new exercises
  if (toInsert.length > 0) {
    console.log('[seed] Inserting new exercises...')
    const { error } = await supabase.from('exercises').insert(toInsert)
    if (error) throw new Error(`Insert failed: ${error.message}`)
    console.log(`[seed] ✓ Inserted ${toInsert.length} exercises`)
  }

  // 4. Update existing exercises (metadata only — IDs are preserved)
  if (toUpdate.length > 0) {
    console.log('[seed] Updating existing exercises...')
    const results = await Promise.all(
      toUpdate.map(({ id, ...fields }) =>
        supabase.from('exercises').update(fields).eq('id', id)
      )
    )
    const errors = results.filter((r) => r.error).map((r) => r.error.message)
    if (errors.length > 0) throw new Error(`Update errors:\n  ${errors.join('\n  ')}`)
    console.log(`[seed] ✓ Updated ${toUpdate.length} exercises`)
  }

  // 5. Verify and print summary
  const { data: final, error: finalErr } = await supabase
    .from('exercises')
    .select('id, name, category, tier')
    .is('created_by', null)
    .order('category')
    .order('tier')

  if (finalErr) throw new Error(`Verification query failed: ${finalErr.message}`)

  console.log(`\n[seed] ✓ Complete — ${final?.length ?? 0} system exercises in database:\n`)

  const byCategory = {}
  for (const ex of final ?? []) {
    if (!byCategory[ex.category]) byCategory[ex.category] = []
    byCategory[ex.category].push(ex.name)
  }
  for (const [cat, names] of Object.entries(byCategory)) {
    console.log(`  ${cat.padEnd(12)} (${names.length})`)
    for (const name of names) {
      console.log(`    · ${name}`)
    }
  }
  console.log()

  // 6. Warn about known duplicate
  const ohp = final?.filter((e) => e.name === 'Overhead Barbell Press' || e.name === 'Standing OHP')
  if (ohp?.length === 2) {
    console.log('[seed] ⚠ Duplicate detected: "Overhead Barbell Press" and "Standing OHP" are')
    console.log('[seed]   the same movement. Consolidate when exercise history supports it.\n')
  }
}

seed().catch((err) => {
  console.error(`\n[seed] ✗ Fatal: ${err.message}\n`)
  process.exit(1)
})
