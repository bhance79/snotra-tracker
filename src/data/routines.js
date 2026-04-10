export const MUSCLE_COLORS = {
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
}

export const ROUTINES = [
  {
    id: 'push',
    label: 'Push',
    subtitle: 'Chest · Shoulders · Triceps',
    exercises: ['Barbell Bench Press', 'Incline DB Press', 'Cable Lateral Raise', 'OHP Dumbbell', 'Tricep Pushdown', 'OH Tricep Extension'],
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
            name: 'Incline Dumbbell Press',
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
            name: 'Overhead Dumbbell Press',
            setsReps: '3 × 8–10',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Front Delts', 'Side Delts', 'Triceps', 'Traps'],
          },
          {
            name: 'Tricep Pushdown (cable)',
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
    id: 'pull',
    label: 'Pull',
    subtitle: 'Back · Biceps · Rear Delts',
    exercises: ['Barbell Row', 'Weighted Pull-up', 'Seated Cable Row', 'Face Pull', 'Incline DB Curl', 'Hammer Curl'],
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
            name: 'Weighted Pull-up / Lat Pulldown',
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
            name: 'Face Pull (cable)',
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
    id: 'lower-quad',
    label: 'Lower',
    subtitle: 'Quad Focus · Hamstrings · Calves',
    exercises: ['Barbell Back Squat', 'Leg Press', 'Walking Lunge', 'Leg Curl', 'Leg Extension', 'Standing Calf Raise'],
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
            name: 'Walking Lunge (dumbbell)',
            setsReps: '3 × 10 ea.',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Quads', 'Glutes', 'Hip Flexors'],
          },
          {
            name: 'Leg Curl (machine)',
            setsReps: '3 × 12',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Hamstrings'],
          },
          {
            name: 'Leg Extension',
            setsReps: '2 × 15',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Quads'],
          },
          {
            name: 'Standing Calf Raise',
            setsReps: '4 × 15',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Calves'],
          },
        ],
      },
    ],
  },
  {
    id: 'upper',
    label: 'Upper',
    subtitle: 'Heavy Compounds · Intensity Focus',
    exercises: ['Overhead Barbell Press', 'Close-Grip Bench', 'Single-Arm DB Row', 'Cable Lateral Raise', 'Rear Delt Fly', 'Barbell Curl'],
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
            name: 'Close-Grip Barbell Bench Press',
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
            name: 'Single-Arm Dumbbell Row',
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
            name: 'Rear Delt Fly (machine or cable)',
            setsReps: '3 × 15',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Rear Delts', 'Rhomboids'],
          },
          {
            name: 'Barbell or Dumbbell Curl',
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
    id: 'lower-hinge',
    label: 'Lower',
    subtitle: 'Hinge Focus · Glutes · Hamstrings',
    exercises: ['Conventional Deadlift', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Hip Thrust', 'Nordic Curl', 'Seated Calf Raise'],
    sections: [
      {
        title: 'Compound lifts',
        exercises: [
          {
            name: 'Conventional Deadlift',
            setsReps: '4 × 4–5',
            progression: 'Add 5 kg when top rep hit 2 sessions in a row',
            selected: true,
            muscles: ['Compound Lift', 'Hamstrings', 'Glutes', 'Lats', 'Traps'],
          },
          {
            name: 'Romanian Deadlift',
            setsReps: '3 × 8–10',
            progression: 'Add 2.5 kg when top rep hit 2 sessions in a row',
            selected: true,
            muscles: ['Hamstrings', 'Glutes'],
          },
        ],
      },
      {
        title: 'Accessory lifts',
        exercises: [
          {
            name: 'Bulgarian Split Squat (dumbbell)',
            setsReps: '3 × 8 ea.',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Quads', 'Glutes', 'Hip Flexors'],
          },
          {
            name: 'Hip Thrust (barbell)',
            setsReps: '3 × 10',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Glutes', 'Hamstrings'],
          },
          {
            name: 'Nordic Curl / Leg Curl',
            setsReps: '3 × 8–10',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Hamstrings'],
          },
          {
            name: 'Seated Calf Raise',
            setsReps: '3 × 15',
            progression: 'Add reps, then weight',
            selected: true,
            muscles: ['Calves'],
          },
        ],
      },
    ],
  },
]
