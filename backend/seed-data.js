/**
 * Seed Data for Workout Tracker
 * Based on workout spreadsheet data
 */

// 12-Day Workout Cycle Definition
export const workoutDays = [
  { dayNumber: 1, name: 'Compound: Legs', focus: 'Main Lift: Squat. Systemic leg strength.', primaryMuscleGroups: ['legs', 'glutes', 'quads'] },
  { dayNumber: 2, name: 'Calves', focus: 'Active recovery.', primaryMuscleGroups: ['calves'] },
  { dayNumber: 3, name: 'Hamstring', focus: 'Isolation. (Safe here since Day 1 was Squats).', primaryMuscleGroups: ['hamstrings'] },
  { dayNumber: 4, name: 'Abs', focus: 'Flexion focus.', primaryMuscleGroups: ['abs', 'core'] },
  { dayNumber: 5, name: 'Compound: Pulls', focus: 'Main Lift: Back/Rows. Systemic pulling strength.', primaryMuscleGroups: ['back', 'lats'] },
  { dayNumber: 6, name: 'Bicep', focus: 'Accessory work.', primaryMuscleGroups: ['biceps'] },
  { dayNumber: 7, name: 'Torso', focus: 'Extension/Rotation. Placed here to save lower back for Day 1.', primaryMuscleGroups: ['core', 'back'] },
  { dayNumber: 8, name: 'Pecs (Mobility)', focus: 'The Primer. Light flys/holds to prep shoulder capsule. ⚠️ NO DIPS or heavy pressing.', primaryMuscleGroups: ['chest'], warning: 'Shoulder health priority - light work only' },
  { dayNumber: 9, name: 'Compound: Push', focus: 'Main Lift: DB Bench. Heavy chest/front delt focus.', primaryMuscleGroups: ['chest', 'shoulders', 'triceps'] },
  { dayNumber: 10, name: 'Triceps', focus: 'Isolation. Focus on "feel" to save elbows.', primaryMuscleGroups: ['triceps'] },
  { dayNumber: 11, name: 'Deltoid', focus: 'Shoulder isolation.', primaryMuscleGroups: ['shoulders', 'delts'] },
  { dayNumber: 12, name: 'Grip', focus: 'Forearm/Hand focus. Final burnout.', primaryMuscleGroups: ['forearms', 'grip'] }
];

// Historical Logged Workouts (from spreadsheet)
export const loggedWorkouts = [
  // 2026 Workouts
  { date: '2026-02-14', dayNumber: 8, dayName: 'Pecs (Mobility)', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-29', dayNumber: 11, dayName: 'Deltoid', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-26', dayNumber: 6, dayName: 'Bicep', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-23', dayNumber: 5, dayName: 'Compound: Pulls', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-22', dayNumber: 4, dayName: 'Abs', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-08', dayNumber: 3, dayName: 'Hamstring', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-05', dayNumber: 2, dayName: 'Calves', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2026-01-04', dayNumber: 1, dayName: 'Compound: Legs', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  
  // 2025 November/December Workouts
  { date: '2025-12-11', dayNumber: 6, dayName: 'Bicep', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-12-10', dayNumber: 5, dayName: 'Compound: Pulls', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-12-09', dayNumber: 7, dayName: 'Torso', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-12-08', dayNumber: 1, dayName: 'Compound: Legs', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-12-07', dayNumber: 10, dayName: 'Triceps', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-12-05', dayNumber: 12, dayName: 'Grip', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-26', dayNumber: 9, dayName: 'Compound: Push', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-25', dayNumber: 6, dayName: 'Bicep', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-24', dayNumber: 5, dayName: 'Compound: Pulls', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-16', dayNumber: 7, dayName: 'Torso', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-15', dayNumber: 1, dayName: 'Compound: Legs', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' },
  { date: '2025-11-14', dayNumber: 12, dayName: 'Grip', userId: 'cf57d57d-1411-4f59-b517-e9a8600b140a' }
];

// Exercise Library (from spreadsheet exercise sheets)
export const exercises = [
  // Compound: Legs
  { name: 'Barbell Squat (Smith Machine)', dayNumber: 1, equipment: 'Smith Machine', targetWeight: 115, targetReps: '6-8', targetSets: 4, location: 'Gym' },
  { name: 'Leg Press', dayNumber: 1, equipment: 'Leg Press Machine', targetWeight: 140, targetReps: 12, targetSets: 3, location: 'Gym' },
  { name: 'Leg Extension', dayNumber: 1, equipment: 'Leg Extension Machine', targetWeight: 60, targetReps: '12-15', targetSets: 3, location: 'Gym', notes: 'Lowest seat, legs notch 1, back notch 1. Superset with leg curls' },
  { name: 'Leg Curl', dayNumber: 1, equipment: 'Leg Curl Machine', targetWeight: 60, targetReps: '12-15', targetSets: 3, location: 'Gym', notes: 'Highest seat, legs at lowest notch. Superset with leg extension' },
  { name: 'Seated Calf Raises', dayNumber: 1, equipment: 'Bench + Dumbbells', targetWeight: 80, targetReps: 12, targetSets: 3, location: 'Gym' },
  
  // Calves
  { name: 'Calf Stands', dayNumber: 2, equipment: 'Bodyweight', targetReps: '5 minutes', location: 'Anywhere', notes: 'Stand on toes for about 5 minutes' },
  { name: 'Calf Stretches', dayNumber: 2, equipment: 'None', location: 'Anywhere' },
  { name: 'Seated Calf Raises', dayNumber: 2, equipment: 'Seated Calf Raise Machine', targetWeight: 90, targetReps: 12, targetSets: 3, location: 'Gym' },
  
  // Hamstring
  { name: 'Single Leg Cable Stretch (Front)', dayNumber: 3, equipment: 'Cable', targetReps: '3-5 minutes, 2-5 times', location: 'Gym' },
  { name: 'Single Leg Cable Stretch (Side)', dayNumber: 3, equipment: 'Cable', targetReps: '3-5 minutes, 2-5 times', location: 'Gym' },
  { name: 'Single Leg Forward Lean', dayNumber: 3, equipment: 'Bodyweight', location: 'Anywhere' },
  { name: 'Seated Splits', dayNumber: 3, equipment: 'None', location: 'Anywhere' },
  
  // Abs
  { name: 'Crunches', dayNumber: 4, equipment: 'Bodyweight', location: 'Anywhere' },
  { name: 'Under Leg Crunches', dayNumber: 4, equipment: 'Bodyweight', location: 'Anywhere' },
  
  // Compound: Pulls
  { name: 'Lat Pulldowns', dayNumber: 5, equipment: 'Cable Machine', targetWeight: 40, targetReps: 12, targetSets: 3, location: 'Home' },
  { name: 'Bent-Over Rows', dayNumber: 5, equipment: 'Barbell', targetWeight: 35, targetReps: 12, targetSets: 3, location: 'Home' },
  { name: 'Seated Cable Rows', dayNumber: 5, equipment: 'Cable Machine', targetWeight: 80, targetReps: 12, targetSets: 3, location: 'Home' },
  
  // Biceps
  { name: 'Dumbbell Bicep Curl', dayNumber: 6, equipment: 'Dumbbells', targetWeight: 20, targetReps: 'Failure', targetSets: 3, location: 'Home', notes: 'Reps to failure, decrease weight by 5-10 each time' },
  { name: 'Cable Bicep Curl', dayNumber: 6, equipment: 'Cable Machine', targetWeight: 20, targetReps: 'Failure', targetSets: 3, location: 'Home', notes: 'Reps to failure, decrease weight by 5-10 each time' },
  
  // Torso
  { name: 'Torso Twist', dayNumber: 7, equipment: 'Torso Twist Machine', targetWeight: 90, targetReps: 20, targetSets: 3, location: 'Gym', notes: 'Max twist. One set is rotating from each side' },
  { name: 'Back Extension (Seated)', dayNumber: 7, equipment: 'Seated Back Extension Machine', targetWeight: 140, targetReps: 12, targetSets: 3, location: 'Gym', notes: 'Max range of motion' },
  { name: 'Hip Adductor', dayNumber: 7, equipment: 'Hip Adductor Machine', targetWeight: 100, targetReps: 'Failure', targetSets: 3, location: 'Gym', notes: 'Max stretch. Involves static stretching and contractions' },
  { name: 'Hip Abductor', dayNumber: 7, equipment: 'Hip Abductor Machine', targetWeight: 80, targetReps: 'Failure', targetSets: 3, location: 'Gym' },
  { name: 'Situps', dayNumber: 7, equipment: 'Situp Device', targetReps: 12, targetSets: 3, location: 'Gym' },
  
  // Pecs (Mobility)
  { name: 'Dumbbell Bench Press (Light)', dayNumber: 8, equipment: 'Dumbbells', targetWeight: 20, targetReps: 12, targetSets: 3, location: 'Home', notes: '⚠️ Light weight only for mobility' },
  { name: 'Cable Fly', dayNumber: 8, equipment: 'Cable Machine', location: 'Home', notes: '⚠️ Light weight, focus on stretch' },
  { name: 'Static Hold (Lowered Position)', dayNumber: 8, equipment: 'Dumbbells', location: 'Home', notes: '⚠️ Horizontal dumbbell hold in lowered position' },
  
  // Compound: Push
  { name: 'Barbell Bench Press (Smith Machine)', dayNumber: 9, equipment: 'Smith Machine', targetWeight: 115, targetReps: 12, targetSets: 3, location: 'Gym' },
  { name: 'Dumbbell Bench Press', dayNumber: 9, equipment: 'Dumbbells', targetWeight: 20, targetReps: 12, targetSets: 3, location: 'Home', notes: 'Reps to failure, decreasing weight' },
  { name: 'Dips', dayNumber: 9, equipment: 'Dip Machine', targetWeight: -90, targetReps: '15-20', targetSets: 3, location: 'Gym' },
  
  // Triceps
  { name: 'Cable Standing High Cross', dayNumber: 10, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Tricep Pushdown', dayNumber: 10, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Tricep Extension (Katana)', dayNumber: 10, equipment: 'Dumbbell', targetWeight: 10, location: 'Home' },
  
  // Deltoids
  { name: 'Reverse Delt Cable Fly', dayNumber: 11, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Side Delt Cable Raises', dayNumber: 11, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Front Deltoid Raises (Bottom to Top)', dayNumber: 11, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Front Deltoid Raises (Top to Bottom)', dayNumber: 11, equipment: 'Cable Machine', location: 'Home' },
  { name: 'Rotator Cuff Work', dayNumber: 11, equipment: 'Light Weight', location: 'Home' },
  
  // Grip
  { name: 'Gripper - Trainer', dayNumber: 12, equipment: 'Hand Gripper', targetReps: 'Failure', targetSets: 3, location: 'Home', notes: 'Start with left/weak side' },
  { name: 'Gripper - Sport', dayNumber: 12, equipment: 'Hand Gripper', targetReps: 'Failure', targetSets: 3, location: 'Home', notes: 'Start with left/weak side' },
  { name: 'Gripper - Guide', dayNumber: 12, equipment: 'Hand Gripper', targetReps: 'Failure', targetSets: 3, location: 'Home', notes: 'Start with left/weak side' },
  { name: 'Wrist Curls (Pronated)', dayNumber: 12, equipment: 'Dumbbells', targetWeight: 20, targetReps: 'Failure', targetSets: 3, location: 'Home' },
  { name: 'Wrist Curls (Supinated)', dayNumber: 12, equipment: 'Dumbbells', targetWeight: 20, targetReps: 'Failure', targetSets: 3, location: 'Home' }
];
