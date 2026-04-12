// Exercise library — muscles, tier (1–3), liftType, movement pattern, equipment
// muscles[] keys must match lowercase entries in MUSCLE_COLORS

export const EXERCISE_LIBRARY = [

  // ── CHEST ──────────────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press',        category: 'Chest',     muscles: ['chest', 'triceps', 'front delts'],          tier: 1, liftType: 'compound',   pattern: 'horizontal push', equipment: 'barbell' },
  { name: 'Incline Barbell Bench',      category: 'Chest',     muscles: ['chest', 'upper chest', 'triceps'],          tier: 1, liftType: 'compound',   pattern: 'horizontal push', equipment: 'barbell' },
  { name: 'Incline Dumbbell Bench',     category: 'Chest',     muscles: ['chest', 'upper chest', 'triceps'],          tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'dumbbell' },
  { name: 'Flat Dumbbell Bench',        category: 'Chest',     muscles: ['chest', 'triceps', 'front delts'],          tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'dumbbell' },
  { name: 'Reverse Grip DB Press',      category: 'Chest',     muscles: ['chest', 'upper chest', 'triceps'],          tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'dumbbell' },
  { name: 'Machine Chest Press',        category: 'Chest',     muscles: ['chest', 'triceps'],                         tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'machine' },
  { name: 'Hammer Press',               category: 'Chest',     muscles: ['chest', 'triceps'],                         tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'machine' },
  { name: 'Weighted Dips',              category: 'Chest',     muscles: ['chest', 'triceps'],                         tier: 2, liftType: 'accessory',  pattern: 'vertical push',   equipment: 'bodyweight' },
  { name: 'Push-Ups',                   category: 'Chest',     muscles: ['chest', 'triceps'],                         tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'bodyweight' },
  { name: 'Diamond Push-Ups',           category: 'Chest',     muscles: ['chest', 'triceps'],                         tier: 2, liftType: 'accessory',  pattern: 'horizontal push', equipment: 'bodyweight' },
  { name: 'Incline Dumbbell Fly',       category: 'Chest',     muscles: ['chest'],                                    tier: 3, liftType: 'isolation',  pattern: 'fly',             equipment: 'dumbbell' },
  { name: 'Machine Chest Fly',          category: 'Chest',     muscles: ['chest'],                                    tier: 3, liftType: 'isolation',  pattern: 'fly',             equipment: 'machine' },
  { name: 'Cable Chest Fly',            category: 'Chest',     muscles: ['chest'],                                    tier: 3, liftType: 'isolation',  pattern: 'fly',             equipment: 'cable' },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { name: 'Overhead Barbell Press',     category: 'Shoulders', muscles: ['shoulders', 'triceps'],                     tier: 1, liftType: 'compound',   pattern: 'vertical push',   equipment: 'barbell' },
  { name: 'Standing OHP',               category: 'Shoulders', muscles: ['shoulders', 'triceps', 'core'],             tier: 1, liftType: 'compound',   pattern: 'vertical push',   equipment: 'barbell' },
  { name: 'Dumbbell Shoulder Press',    category: 'Shoulders', muscles: ['shoulders', 'triceps'],                     tier: 2, liftType: 'accessory',  pattern: 'vertical push',   equipment: 'dumbbell' },
  { name: 'Arnold Press',               category: 'Shoulders', muscles: ['shoulders', 'triceps'],                     tier: 2, liftType: 'accessory',  pattern: 'vertical push',   equipment: 'dumbbell' },
  { name: 'Cable Upright Row',          category: 'Shoulders', muscles: ['shoulders', 'traps'],                       tier: 2, liftType: 'accessory',  pattern: 'vertical pull',   equipment: 'cable' },
  { name: 'Face Pull',                  category: 'Shoulders', muscles: ['shoulders', 'traps'],                       tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'cable' },
  { name: 'Lateral Raise',              category: 'Shoulders', muscles: ['shoulders'],                                tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise',        category: 'Shoulders', muscles: ['shoulders'],                                tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'cable' },
  { name: 'Front Raise',                category: 'Shoulders', muscles: ['shoulders'],                                tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'dumbbell' },
  { name: 'Plate Raise',                category: 'Shoulders', muscles: ['shoulders'],                                tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'plate' },
  { name: 'Rear Delt Fly',              category: 'Shoulders', muscles: ['shoulders'],                                tier: 3, liftType: 'isolation',  pattern: 'fly',             equipment: 'dumbbell/machine' },

  // ── ARMS — TRICEPS ─────────────────────────────────────────────────────────
  { name: 'Close-Grip Bench Press',     category: 'Arms',      muscles: ['triceps', 'chest'],                         tier: 1, liftType: 'compound',   pattern: 'horizontal push', equipment: 'barbell' },
  { name: 'Skullcrushers',              category: 'Arms',      muscles: ['triceps'],                                  tier: 2, liftType: 'accessory',  pattern: 'extension',       equipment: 'barbell/EZ' },
  { name: 'Tricep Pushdown',            category: 'Arms',      muscles: ['triceps'],                                  tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'cable' },
  { name: 'Overhead Tricep Extension',  category: 'Arms',      muscles: ['triceps'],                                  tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'cable/dumbbell' },
  { name: 'Seated French Curl',         category: 'Arms',      muscles: ['triceps'],                                  tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'dumbbell/barbell' },
  { name: 'Single Arm Tricep Extension',category: 'Arms',      muscles: ['triceps'],                                  tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'dumbbell' },
  { name: 'Reverse Grip Tricep Extension', category: 'Arms',   muscles: ['triceps'],                                  tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'cable' },

  // ── ARMS — BICEPS ──────────────────────────────────────────────────────────
  { name: 'Barbell Curl',               category: 'Arms',      muscles: ['biceps'],                                   tier: 2, liftType: 'accessory',  pattern: 'curl',            equipment: 'barbell' },
  { name: 'Dumbbell Curl',              category: 'Arms',      muscles: ['biceps'],                                   tier: 2, liftType: 'accessory',  pattern: 'curl',            equipment: 'dumbbell' },
  { name: 'EZ Bar Curl',                category: 'Arms',      muscles: ['biceps'],                                   tier: 2, liftType: 'accessory',  pattern: 'curl',            equipment: 'EZ bar' },
  { name: 'Incline Dumbbell Curl',      category: 'Arms',      muscles: ['biceps'],                                   tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'dumbbell' },
  { name: 'Incline Alternating Curl',   category: 'Arms',      muscles: ['biceps'],                                   tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'dumbbell' },
  { name: 'Spider Curl',                category: 'Arms',      muscles: ['biceps'],                                   tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'dumbbell/barbell' },
  { name: 'Concentration Curl',         category: 'Arms',      muscles: ['biceps'],                                   tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'dumbbell' },
  { name: 'Hammer Curl',                category: 'Arms',      muscles: ['biceps', 'brachialis'],                     tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'dumbbell/rope' },

  // ── BACK — HORIZONTAL PULL ────────────────────────────────────────────────
  { name: 'Barbell Row',                category: 'Back',      muscles: ['back', 'lats'],                             tier: 1, liftType: 'compound',   pattern: 'horizontal pull', equipment: 'barbell' },
  { name: 'T-Bar Row',                  category: 'Back',      muscles: ['back', 'lats'],                             tier: 1, liftType: 'compound',   pattern: 'horizontal pull', equipment: 'machine/barbell' },
  { name: 'Landmine Row',               category: 'Back',      muscles: ['back', 'lats'],                             tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'barbell' },
  { name: 'Seated Cable Row',           category: 'Back',      muscles: ['back'],                                     tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'cable' },
  { name: 'Single Arm DB Row',          category: 'Back',      muscles: ['back'],                                     tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'dumbbell' },
  { name: 'Inverted Row',               category: 'Back',      muscles: ['back'],                                     tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'bodyweight' },
  { name: 'Incline Seal Row',           category: 'Back',      muscles: ['back'],                                     tier: 2, liftType: 'accessory',  pattern: 'horizontal pull', equipment: 'dumbbell' },
  { name: 'Back Extension',             category: 'Back',      muscles: ['back', 'erectors', 'glutes'],               tier: 2, liftType: 'accessory',  pattern: 'hinge',           equipment: 'bodyweight' },

  // ── BACK — VERTICAL PULL ──────────────────────────────────────────────────
  { name: 'Pull-Ups',                   category: 'Back',      muscles: ['back', 'lats'],                             tier: 1, liftType: 'compound',   pattern: 'vertical pull',   equipment: 'bodyweight' },
  { name: 'V-Bar Pullups',              category: 'Back',      muscles: ['back', 'lats'],                             tier: 1, liftType: 'compound',   pattern: 'vertical pull',   equipment: 'bodyweight' },
  { name: 'Wide Grip Pulldown',         category: 'Back',      muscles: ['back', 'lats'],                             tier: 2, liftType: 'accessory',  pattern: 'vertical pull',   equipment: 'cable' },
  { name: 'Close Grip Pulldown',        category: 'Back',      muscles: ['back', 'lats'],                             tier: 2, liftType: 'accessory',  pattern: 'vertical pull',   equipment: 'cable' },

  // ── LEGS — QUAD DOMINANT ──────────────────────────────────────────────────
  { name: 'Barbell Back Squat',         category: 'Legs',      muscles: ['quads', 'glutes'],                          tier: 1, liftType: 'compound',   pattern: 'squat',           equipment: 'barbell' },
  { name: 'Paused Squat',               category: 'Legs',      muscles: ['quads', 'glutes'],                          tier: 1, liftType: 'compound',   pattern: 'squat',           equipment: 'barbell' },
  { name: 'Hack Squat',                 category: 'Legs',      muscles: ['quads'],                                    tier: 2, liftType: 'accessory',  pattern: 'squat',           equipment: 'machine' },
  { name: 'Leg Press',                  category: 'Legs',      muscles: ['quads'],                                    tier: 2, liftType: 'accessory',  pattern: 'push',            equipment: 'machine' },
  { name: 'Bulgarian Split Squat',      category: 'Legs',      muscles: ['quads', 'glutes'],                          tier: 2, liftType: 'accessory',  pattern: 'squat',           equipment: 'dumbbell' },
  { name: 'Walking Lunges',             category: 'Legs',      muscles: ['quads', 'glutes'],                          tier: 2, liftType: 'accessory',  pattern: 'lunge',           equipment: 'dumbbell' },
  { name: 'Step-Ups',                   category: 'Legs',      muscles: ['quads', 'glutes'],                          tier: 2, liftType: 'accessory',  pattern: 'lunge',           equipment: 'dumbbell' },
  { name: 'Goblet Squat',               category: 'Legs',      muscles: ['quads'],                                    tier: 2, liftType: 'accessory',  pattern: 'squat',           equipment: 'dumbbell' },
  { name: 'Single Leg Squat',           category: 'Legs',      muscles: ['quads'],                                    tier: 2, liftType: 'accessory',  pattern: 'squat',           equipment: 'bodyweight' },
  { name: 'Leg Extension',              category: 'Legs',      muscles: ['quads'],                                    tier: 3, liftType: 'isolation',  pattern: 'extension',       equipment: 'machine' },
  { name: 'Hip Abduction',              category: 'Legs',      muscles: ['glutes', 'hip abductors'],                  tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'machine/cable' },
  { name: 'Cable Hip Abduction',        category: 'Legs',      muscles: ['glutes', 'hip abductors'],                  tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'cable' },
  { name: 'Hip Adduction',              category: 'Legs',      muscles: ['hip adductors'],                            tier: 3, liftType: 'isolation',  pattern: 'flexion',         equipment: 'machine/cable' },

  // ── LEGS — HINGE / POSTERIOR ──────────────────────────────────────────────
  { name: 'Deadlift',                   category: 'Legs',      muscles: ['hamstrings', 'glutes'],                     tier: 1, liftType: 'compound',   pattern: 'hinge',           equipment: 'barbell' },
  { name: 'Deficit Deadlift',           category: 'Legs',      muscles: ['hamstrings'],                               tier: 2, liftType: 'accessory',  pattern: 'hinge',           equipment: 'barbell' },
  { name: 'Romanian Deadlift',          category: 'Legs',      muscles: ['hamstrings', 'glutes'],                     tier: 2, liftType: 'accessory',  pattern: 'hinge',           equipment: 'barbell/dumbbell' },
  { name: 'Single-Leg RDL',             category: 'Legs',      muscles: ['hamstrings', 'glutes'],                     tier: 2, liftType: 'accessory',  pattern: 'hinge',           equipment: 'dumbbell' },
  { name: 'Leg Press (High Foot)',       category: 'Legs',      muscles: ['glutes', 'hamstrings', 'quads'],            tier: 2, liftType: 'accessory',  pattern: 'push',            equipment: 'machine' },
  { name: 'Hip Thrust',                 category: 'Legs',      muscles: ['glutes', 'hamstrings'],                     tier: 2, liftType: 'accessory',  pattern: 'hinge',           equipment: 'barbell' },
  { name: 'Leg Curl',                   category: 'Legs',      muscles: ['hamstrings'],                               tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'machine' },
  { name: 'Nordic Curl',                category: 'Legs',      muscles: ['hamstrings'],                               tier: 3, liftType: 'isolation',  pattern: 'curl',            equipment: 'bodyweight' },

  // ── CALVES ────────────────────────────────────────────────────────────────
  { name: 'Standing Calf Raise',        category: 'Calves',    muscles: ['calves'],                                   tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'machine/bodyweight' },
  { name: 'Seated Calf Raise',          category: 'Calves',    muscles: ['calves'],                                   tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'machine' },
  { name: 'Seated Toe Raises',          category: 'Calves',    muscles: ['calves'],                                   tier: 3, liftType: 'isolation',  pattern: 'raise',           equipment: 'bodyweight' },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { name: 'Cable Crunch',               category: 'Core',      muscles: ['core'],                                     tier: 3, liftType: 'isolation',  pattern: 'flexion',         equipment: 'cable' },
  { name: 'Machine Crunch',             category: 'Core',      muscles: ['core'],                                     tier: 3, liftType: 'isolation',  pattern: 'flexion',         equipment: 'machine' },
  { name: 'Decline Sit-Up',             category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'flexion',         equipment: 'bodyweight' },
  { name: 'Hanging Leg Raise',          category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'flexion',         equipment: 'bodyweight' },
  { name: 'Hanging Knee Raise',         category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'flexion',         equipment: 'bodyweight' },
  { name: "Captain's Chair Leg Raise",  category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'flexion',         equipment: 'machine' },
  { name: 'Ab Wheel Rollout',           category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-extension',  equipment: 'bodyweight' },
  { name: 'Stability Ball Rollout',     category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-extension',  equipment: 'ball' },
  { name: 'Plank',                      category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-extension',  equipment: 'bodyweight' },
  { name: 'Dead Bug',                   category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-extension',  equipment: 'bodyweight' },
  { name: 'Bird Dog',                   category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-extension',  equipment: 'bodyweight' },
  { name: 'Side Plank',                 category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'anti-lateral flexion', equipment: 'bodyweight' },
  { name: 'Copenhagen Plank',           category: 'Core',      muscles: ['core', 'hip adductors'],                    tier: 2, liftType: 'accessory',  pattern: 'anti-lateral flexion', equipment: 'bodyweight' },
  { name: 'Cable Woodchopper',          category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'rotation',        equipment: 'cable' },
  { name: 'Russian Twist',              category: 'Core',      muscles: ['core'],                                     tier: 2, liftType: 'accessory',  pattern: 'rotation',        equipment: 'bodyweight/weight' },
]

// Unique muscle groups across the library
export const ALL_MUSCLES = [...new Set(EXERCISE_LIBRARY.flatMap((e) => e.muscles))].sort()
