export type Ex = { name: string; sets: number; reps: string; unit?: string }
export type Day = { kind: 'strength' | 'cardio' | 'rest'; title: string; ex?: Ex[]; options?: string[] }
const E = (name: string, sets: number, reps: string): Ex => ({ name, sets, reps })
export const PLAN: Record<number, Day> = {
  1: { kind: 'strength', title: 'Upper A', ex: [E('Dumbbell Floor Press', 4, '8–15'), E('One-Arm Dumbbell Row', 4, '10–15 each side'), E('Dumbbell Shoulder Press', 3, '8–15'), E('Push-Ups', 3, '8–20'), E('Dumbbell Lateral Raise', 3, '12–20'), E('Dumbbell Curl', 3, '10–15'), E('Overhead Dumbbell Triceps Extension', 3, '10–15')] },
  2: { kind: 'strength', title: 'Lower A', ex: [E('Goblet Squat', 4, '10–20'), E('Bulgarian Split Squat', 3, '8–15 each leg'), E('Dumbbell Romanian Deadlift', 4, '10–15'), E('Reverse Lunges', 3, '10–15 each leg'), E('Single-Leg Calf Raise', 4, '12–20'), E('Plank', 3, '30–60 sec')] },
  3: { kind: 'cardio', title: 'Cardio', options: ['Easy run'] },
  4: { kind: 'strength', title: 'Upper B', ex: [E('Push-Ups', 4, '8–20'), E('One-Arm Dumbbell Row', 4, '10–15 each side'), E('Dumbbell Floor Press', 3, '10–20'), E('Pike Push-Ups', 3, '6–15'), E('Dumbbell Lateral Raise', 3, '15–25'), E('Hammer Curl', 3, '10–15'), E('Dumbbell Triceps Extension', 3, '10–15')] },
  5: { kind: 'strength', title: 'Lower B', ex: [E('Bulgarian Split Squat', 4, '10–15 each leg'), E('Single-Leg Romanian Deadlift', 3, '10–15 each leg'), E('Goblet Squat', 3, '15–25'), E('Walking Lunges', 3, '10–15 each leg'), E('Single-Leg Calf Raise', 4, '15–25'), E('Dead Bug', 3, '10–15 each side')] },
  6: { kind: 'cardio', title: 'Cardio / Active day', options: ['Easy run', 'Cycling', 'Sport', 'Long walk'] },
  0: { kind: 'rest', title: 'Rest' },
}
export const PR_EXERCISES = ['Push-Ups', 'Dumbbell Floor Press', 'Goblet Squat']
export const ALL_EXERCISES = Array.from(new Set(Object.values(PLAN).flatMap(d => d.ex?.map(e => e.name) ?? [])))
export const MEALS: Record<string, string[]> = {
  Breakfast: ['Eggs', 'Roti / oats / poha', 'Milk', 'Fruit'],
  'Mid-morning': ['Fruit', 'Peanuts / almonds', 'Curd / milk'],
  Lunch: ['Roti / rice', 'Dal', 'Rajma / chole', 'Sabzi', 'Curd', 'Salad'],
  'Pre-workout (pick one)': ['Banana + milk', 'Peanut-butter roti', 'Curd + fruit'],
  'Post-workout (pick one)': ['Eggs', 'Paneer', 'Tofu', 'Soy chunks', 'Dal + rice'],
  Dinner: ['Roti / rice', 'Paneer / tofu / soy / dal', 'Vegetables', 'Curd'],
  'Before bed (optional)': ['Milk', 'Curd', 'Fruit'],
}
export const REQUIRED_MEALS = Object.keys(MEALS).filter(m => !m.includes('optional'))
export const TIPS = ['Match or beat last time. Same reps with slower lowering counts too.', 'No heavier weights? Try a 2-second pause at the hardest point.', 'Cleaner form and a bigger range of motion are real progress.', 'Stop 1–2 reps before you lose form. No max-effort testing.']
