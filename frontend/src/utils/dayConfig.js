// 12-Day Synergy System Configuration
export const DAY_CONFIG = {
  1: {
    name: "Compound: Legs",
    focus: "Squat focus",
    description: "Heavy compound leg work with emphasis on squat variations",
    exercises: ["Back Squat", "Front Squat", "Bulgarian Split Squat", "Leg Press"],
    color: "bg-blue-600",
    safetyNotes: null
  },
  2: {
    name: "Calves",
    focus: "Active recovery",
    description: "Calf isolation for recovery and ankle stability",
    exercises: ["Standing Calf Raise", "Seated Calf Raise", "Single-Leg Calf Raise"],
    color: "bg-green-600",
    safetyNotes: null
  },
  3: {
    name: "Hamstrings",
    focus: "Main Lift: RDL",
    description: "Posterior chain emphasis with Romanian deadlifts",
    exercises: ["Romanian Deadlift", "Lying Leg Curl", "Nordic Curl", "Good Morning"],
    color: "bg-purple-600",
    safetyNotes: null
  },
  4: {
    name: "Abs",
    focus: "Flexion focus",
    description: "Core flexion and anti-extension work",
    exercises: ["Cable Crunch", "Hanging Leg Raise", "Ab Wheel", "Dead Bug"],
    color: "bg-yellow-600",
    safetyNotes: null
  },
  5: {
    name: "Compound: Pulls",
    focus: "Back/Rows",
    description: "Horizontal and vertical pulling movements",
    exercises: ["Barbell Row", "Pull-Up", "Lat Pulldown", "Cable Row"],
    color: "bg-indigo-600",
    safetyNotes: null
  },
  6: {
    name: "Bicep",
    focus: "Accessory",
    description: "Bicep isolation work following pull day",
    exercises: ["Barbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl"],
    color: "bg-pink-600",
    safetyNotes: null
  },
  7: {
    name: "Torso",
    focus: "Extension/Rotation",
    description: "Core extension and rotational strength",
    exercises: ["Back Extension", "Pallof Press", "Russian Twist", "Bird Dog"],
    color: "bg-teal-600",
    safetyNotes: null
  },
  8: {
    name: "Pecs (Mobility)",
    focus: "⚠️ CRITICAL: NO DIPS or HEAVY PRESSING",
    description: "Light mobility work only - shoulder injury protection",
    exercises: ["Cable Fly (Light)", "Pec Stretch", "Floor Press (Light)", "Band Pull-Apart"],
    color: "bg-red-600",
    safetyNotes: "⚠️ SHOULDER SAFETY: Do NOT perform dips or heavy pressing movements. Light flys and holds only. Focus on mobility and control."
  },
  9: {
    name: "Compound: Push",
    focus: "DB Bench - Dips allowed here",
    description: "Heavy pressing work (dips are safe on this day)",
    exercises: ["Dumbbell Bench Press", "Dips", "Incline DB Press", "Push-Up Variations"],
    color: "bg-orange-600",
    safetyNotes: null
  },
  10: {
    name: "Triceps",
    focus: "Cable High Cross - NO pushdowns",
    description: "Tricep isolation (user prefers no pushdowns)",
    exercises: ["Cable High Cross", "Overhead Extension", "Skull Crusher", "Close-Grip Bench"],
    color: "bg-cyan-600",
    safetyNotes: "User preference: Avoid tricep pushdowns"
  },
  11: {
    name: "Deltoid",
    focus: "Rear/Side isolation",
    description: "Shoulder isolation with rear and side delt focus",
    exercises: ["Rear Delt Fly", "Lateral Raise", "Face Pull", "Upright Row"],
    color: "bg-violet-600",
    safetyNotes: null
  },
  12: {
    name: "Grip",
    focus: "Forearm burnout",
    description: "Grip strength and forearm endurance",
    exercises: ["Farmer's Walk", "Wrist Curl", "Reverse Curl", "Dead Hang"],
    color: "bg-lime-600",
    safetyNotes: null
  }
};

export const getTotalDays = () => 12;

export const getNextDay = (currentDay) => {
  return currentDay >= 12 ? 1 : currentDay + 1;
};

export const getPreviousDay = (currentDay) => {
  return currentDay <= 1 ? 12 : currentDay - 1;
};

export const getDayInfo = (dayNumber) => {
  return DAY_CONFIG[dayNumber] || null;
};
