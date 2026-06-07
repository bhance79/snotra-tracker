export const MUSCLE_COLORS = {
  // ── Capitalized — used by ROUTINES workout session ───────────────────────
  'Compound Lift': 'bg-zinc-600 text-white',
  'Lats':          'bg-red-500 text-white',
  'Rhomboids':     'bg-green-400 text-black',
  'Traps':         'bg-yellow-300 text-black',
  'Rear Delts':    'bg-sky-400 text-black',
  'Biceps':        'bg-cyan-400 text-black',
  'Chest':         'bg-orange-500 text-white',
  'Front Delts':   'bg-purple-400 text-white',
  'Side Delts':    'bg-pink-400 text-white',
  'Triceps':       'bg-indigo-400 text-white',
  'Quads':         'bg-lime-400 text-black',
  'Hamstrings':    'bg-amber-400 text-black',
  'Glutes':        'bg-rose-400 text-white',
  'Calves':        'bg-teal-400 text-black',
  'Core':          'bg-violet-400 text-white',
  'Hip Flexors':   'bg-fuchsia-400 text-white',
  'Erectors':      'bg-stone-400 text-black',
  'Brachialis':    'bg-emerald-400 text-black',
  'Hip Abductors': 'bg-sky-500 text-white',
  'Hip Adductors': 'bg-violet-500 text-white',

  // ── Lowercase — used by exercise library / search view ───────────────────
  'chest':         'bg-orange-500 text-white',
  'upper chest':   'bg-orange-300 text-black',
  'triceps':       'bg-indigo-400 text-white',
  'front delts':   'bg-purple-400 text-white',
  'side delts':    'bg-pink-400 text-white',
  'rear delts':    'bg-sky-400 text-black',
  'shoulders':     'bg-pink-400 text-white',
  'traps':         'bg-yellow-300 text-black',
  'core':          'bg-violet-400 text-white',
  'biceps':        'bg-cyan-400 text-black',
  'brachialis':    'bg-emerald-400 text-black',
  'back':          'bg-red-600 text-white',
  'lats':          'bg-red-500 text-white',
  'rhomboids':     'bg-green-400 text-black',
  'erectors':      'bg-stone-400 text-black',
  'glutes':        'bg-rose-400 text-white',
  'quads':         'bg-lime-400 text-black',
  'hamstrings':    'bg-amber-400 text-black',
  'calves':        'bg-teal-400 text-black',
  'hip abductors': 'bg-sky-500 text-white',
  'hip adductors': 'bg-violet-500 text-white',
}

export const ROUTINE_GROUPS = [
  {
    id: 'push',
    label: 'Push',
    subtitle: 'Chest · Shoulders · Triceps',
    variations: [
      {
        id: 'push-a',
        label: 'Push A',
        subtitle: 'Bench Focus',
        exercises: ['Barbell Bench Press', 'Incline Dumbbell Bench', 'Cable Lateral Raise', 'Dumbbell Shoulder Press', 'Tricep Pushdown', 'Overhead Tricep Extension'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Barbell Bench Press',
                setsReps: '4 × 5–6',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Chest', 'Front Delts', 'Triceps'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Incline Dumbbell Bench',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Chest', 'Front Delts', 'Triceps'],
              },
              {
                name: 'Cable Lateral Raise',
                setsReps: '3 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Side Delts'],
              },
              {
                name: 'Dumbbell Shoulder Press',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Front Delts', 'Side Delts', 'Triceps', 'Traps'],
              },
              {
                name: 'Tricep Pushdown',
                setsReps: '3 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Triceps'],
              },
              {
                name: 'Overhead Tricep Extension',
                setsReps: '2 × 12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Triceps'],
              },
            ],
          },
        ],
      },
      {
        id: 'push-b',
        label: 'Push B',
        subtitle: 'OHP Focus',
        exercises: ['Overhead Barbell Press', 'DB Incline Press', 'Arnold Press', 'Cable Lateral Raise', 'Skull Crusher', 'Cable Tricep Pushdown'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Overhead Barbell Press',
                setsReps: '4 × 4–5',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Front Delts', 'Side Delts', 'Triceps', 'Traps'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'DB Incline Press',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Chest', 'Front Delts', 'Triceps'],
              },
              {
                name: 'Arnold Press',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Front Delts', 'Side Delts', 'Triceps'],
              },
              {
                name: 'Cable Lateral Raise',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Side Delts'],
              },
              {
                name: 'Skull Crusher',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Triceps'],
              },
              {
                name: 'Cable Tricep Pushdown',
                setsReps: '2 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Triceps'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pull',
    label: 'Pull',
    subtitle: 'Back · Biceps · Rear Delts',
    variations: [
      {
        id: 'pull-a',
        label: 'Pull A',
        subtitle: 'Row Focus',
        exercises: ['Barbell Row', 'Pull-Ups', 'Seated Cable Row', 'Face Pull', 'Incline Dumbbell Curl', 'Hammer Curl'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Barbell Row',
                setsReps: '4 × 5–6',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Lats', 'Rhomboids', 'Traps', 'Rear Delts'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Pull-Ups',
                setsReps: '3 × 6–8',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Lats', 'Biceps', 'Rear Delts'],
              },
              {
                name: 'Seated Cable Row',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Lats', 'Rhomboids', 'Rear Delts'],
              },
              {
                name: 'Face Pull',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Rear Delts', 'Traps', 'Rhomboids'],
              },
              {
                name: 'Incline Dumbbell Curl',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps'],
              },
              {
                name: 'Hammer Curl',
                setsReps: '2 × 12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps'],
              },
            ],
          },
        ],
      },
      {
        id: 'pull-b',
        label: 'Pull B',
        subtitle: 'Lat Pulldown Focus',
        exercises: ['Lat Pulldown', 'T-Bar Row', 'Single Arm DB Row', 'Face Pull', 'EZ Bar Curl', 'Reverse Curl'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Lat Pulldown',
                setsReps: '4 × 6–8',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Compound Lift', 'Lats', 'Biceps', 'Rear Delts'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'T-Bar Row',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Lats', 'Rhomboids', 'Traps', 'Rear Delts'],
              },
              {
                name: 'Single Arm DB Row',
                setsReps: '3 × 8–10 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps'],
              },
              {
                name: 'Face Pull',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Rear Delts', 'Traps', 'Rhomboids'],
              },
              {
                name: 'EZ Bar Curl',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps'],
              },
              {
                name: 'Reverse Curl',
                setsReps: '2 × 12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps', 'Brachialis'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lower-quad',
    label: 'Legs',
    subtitle: 'Quad Focus · Athletic Stability',
    variations: [
      {
        id: 'legs-a',
        label: 'Legs A',
        subtitle: 'Back Squat Focus',
        exercises: ['Barbell Back Squat', 'Leg Press', 'Bulgarian Split Squat', 'Walking Lunges', 'Leg Extension', 'Hip Abduction', 'Hip Adduction', 'Standing Calf Raise'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Barbell Back Squat',
                setsReps: '4 × 5–6',
                progression: 'Add 5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Quads', 'Glutes', 'Core'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Leg Press',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes'],
              },
              {
                name: 'Bulgarian Split Squat',
                setsReps: '3 × 8 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes', 'Hip Flexors'],
              },
              {
                name: 'Walking Lunges',
                setsReps: '2–3 × 10 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes', 'Hip Flexors'],
              },
              {
                name: 'Leg Extension',
                setsReps: '2 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads'],
              },
              {
                name: 'Hip Abduction',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hip Abductors'],
              },
              {
                name: 'Hip Adduction',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hip Adductors'],
              },
              {
                name: 'Standing Calf Raise',
                setsReps: '4 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Calves'],
              },
            ],
          },
        ],
      },
      {
        id: 'legs-b',
        label: 'Legs B',
        subtitle: 'Front Squat Focus',
        exercises: ['Front Squat', 'Hack Squat', 'Step-Ups', 'Leg Press', 'Leg Extension', 'Hip Adduction', 'Standing Calf Raise'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Front Squat',
                setsReps: '4 × 5–6',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Quads', 'Glutes', 'Core'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Hack Squat',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes'],
              },
              {
                name: 'Step-Ups',
                setsReps: '3 × 10 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes', 'Hip Flexors'],
              },
              {
                name: 'Leg Press',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes'],
              },
              {
                name: 'Leg Extension',
                setsReps: '2 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads'],
              },
              {
                name: 'Hip Adduction',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hip Adductors'],
              },
              {
                name: 'Standing Calf Raise',
                setsReps: '4 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Calves'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'upper',
    label: 'Upper',
    subtitle: 'Heavy Compounds · Intensity Focus',
    variations: [
      {
        id: 'upper-a',
        label: 'Upper A',
        subtitle: 'OHP Focus',
        exercises: ['Overhead Barbell Press', 'Close-Grip Bench Press', 'Single Arm DB Row', 'Cable Lateral Raise', 'Rear Delt Fly', 'Barbell Curl'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Overhead Barbell Press',
                setsReps: '4 × 4–5',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Front Delts', 'Side Delts', 'Triceps', 'Traps'],
              },
              {
                name: 'Close-Grip Bench Press',
                setsReps: '3 × 6–8',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Triceps', 'Chest'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Single Arm DB Row',
                setsReps: '4 × 8 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps'],
              },
              {
                name: 'Cable Lateral Raise',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Side Delts'],
              },
              {
                name: 'Rear Delt Fly',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Rear Delts', 'Rhomboids'],
              },
              {
                name: 'Barbell Curl',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps'],
              },
            ],
          },
        ],
      },
      {
        id: 'upper-b',
        label: 'Upper B',
        subtitle: 'Incline Bench Focus',
        exercises: ['Incline Barbell Bench', 'Barbell Row', 'Weighted Dips', 'Cable Lateral Raise', 'Rear Delt Fly', 'Hammer Curl'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Incline Barbell Bench',
                setsReps: '4 × 5–6',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Chest', 'Front Delts', 'Triceps'],
              },
              {
                name: 'Barbell Row',
                setsReps: '3 × 6–8',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Lats', 'Rhomboids', 'Traps', 'Rear Delts'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Weighted Dips',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Chest', 'Triceps', 'Front Delts'],
              },
              {
                name: 'Cable Lateral Raise',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Side Delts'],
              },
              {
                name: 'Rear Delt Fly',
                setsReps: '3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Rear Delts', 'Rhomboids'],
              },
              {
                name: 'Hammer Curl',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Biceps', 'Brachialis'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lower-hinge',
    label: 'Lower',
    subtitle: 'Hinge Focus · Glutes · Athletic Power',
    variations: [
      {
        id: 'lower-a',
        label: 'Lower A',
        subtitle: 'RDL Focus',
        exercises: ['Romanian Deadlift', 'Hip Thrust', 'Leg Press (High Foot)', 'Bulgarian Split Squat', 'Nordic Curl', 'Single-Leg RDL', 'Cable Hip Abduction', 'Copenhagen Plank', 'Seated Calf Raise'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Romanian Deadlift',
                setsReps: '4 × 6–8',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Hamstrings', 'Glutes', 'Erectors'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Hip Thrust',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hamstrings'],
              },
              {
                name: 'Leg Press (High Foot)',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hamstrings', 'Quads'],
              },
              {
                name: 'Bulgarian Split Squat',
                setsReps: '2–3 × 8 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Quads', 'Glutes', 'Hip Flexors'],
              },
              {
                name: 'Nordic Curl',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hamstrings'],
              },
              {
                name: 'Single-Leg RDL',
                setsReps: '2–3 × 10 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hamstrings', 'Glutes'],
              },
              {
                name: 'Cable Hip Abduction',
                setsReps: '2–3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hip Abductors'],
              },
              {
                name: 'Copenhagen Plank',
                setsReps: '2 × 20–30 sec',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Core', 'Hip Adductors'],
              },
              {
                name: 'Seated Calf Raise',
                setsReps: '3 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Calves'],
              },
            ],
          },
        ],
      },
      {
        id: 'lower-b',
        label: 'Lower B',
        subtitle: 'Deadlift Focus',
        exercises: ['Conventional Deadlift', 'Good Morning', 'Hip Thrust', 'Leg Curl', 'Single-Leg RDL', 'Cable Hip Abduction', 'Seated Calf Raise'],
        sections: [
          {
            title: 'Compound lifts',
            exercises: [
              {
                name: 'Conventional Deadlift',
                setsReps: '4 × 4–5',
                progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
                selected: true,
                muscles: ['Compound Lift', 'Hamstrings', 'Glutes', 'Erectors'],
              },
            ],
          },
          {
            title: 'Accessory lifts',
            exercises: [
              {
                name: 'Good Morning',
                setsReps: '3 × 8–10',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hamstrings', 'Erectors', 'Glutes'],
              },
              {
                name: 'Hip Thrust',
                setsReps: '3 × 10–12',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hamstrings'],
              },
              {
                name: 'Leg Curl',
                setsReps: '3 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hamstrings'],
              },
              {
                name: 'Single-Leg RDL',
                setsReps: '2–3 × 10 ea.',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Hamstrings', 'Glutes'],
              },
              {
                name: 'Cable Hip Abduction',
                setsReps: '2–3 × 15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Glutes', 'Hip Abductors'],
              },
              {
                name: 'Seated Calf Raise',
                setsReps: '3 × 12–15',
                progression: 'Add reps, then weight',
                selected: true,
                muscles: ['Calves'],
              },
            ],
          },
        ],
      },
    ],
  },
]

// Flat array — backwards compatibility for any code that iterates all routines
export const ROUTINES = ROUTINE_GROUPS.flatMap((g) => g.variations)
