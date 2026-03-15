// Static metadata for the 12-day Synergy cycle: names, colors, focus descriptions,
// and safety notes. Used by HistoryTab (color coding), WorkoutDrawer (day info),
// and TodayTab (override dropdown labels).
//
// The actual exercise library lives in the database (seeded from backend/seed-data.js).
// This file intentionally does NOT contain exercise lists — components that need
// exercises fetch them from the API.

export const DAY_CONFIG = {
  1: {
    name: "Compound: Legs",
    focus: "Squat focus",
    description: "Heavy compound leg work with emphasis on squat variations",
    color: "bg-blue-600",
    safetyNotes: null
  },
  2: {
    name: "Calves",
    focus: "Active recovery",
    description: "Calf isolation for recovery and ankle stability",
    color: "bg-green-600",
    safetyNotes: null
  },
  3: {
    name: "Hamstrings",
    focus: "Main Lift: RDL",
    description: "Posterior chain emphasis with Romanian deadlifts",
    color: "bg-purple-600",
    safetyNotes: null
  },
  4: {
    name: "Abs",
    focus: "Flexion focus",
    description: "Core flexion and anti-extension work",
    color: "bg-yellow-600",
    safetyNotes: null
  },
  5: {
    name: "Compound: Pulls",
    focus: "Back/Rows",
    description: "Horizontal and vertical pulling movements",
    color: "bg-indigo-600",
    safetyNotes: null
  },
  6: {
    name: "Bicep",
    focus: "Accessory",
    description: "Bicep isolation work following pull day",
    color: "bg-pink-600",
    safetyNotes: null
  },
  7: {
    name: "Torso",
    focus: "Extension/Rotation",
    description: "Core extension and rotational strength",
    color: "bg-teal-600",
    safetyNotes: null
  },
  8: {
    name: "Pecs (Mobility)",
    focus: "⚠️ CRITICAL: NO DIPS or HEAVY PRESSING",
    description: "Light mobility work only - shoulder injury protection",
    color: "bg-red-600",
    safetyNotes: "⚠️ SHOULDER SAFETY: Do NOT perform dips or heavy pressing movements. Light flys and holds only. Focus on mobility and control."
  },
  9: {
    name: "Compound: Push",
    focus: "DB Bench - Dips allowed here",
    description: "Heavy pressing work (dips are safe on this day)",
    color: "bg-orange-600",
    safetyNotes: null
  },
  10: {
    name: "Triceps",
    focus: "Cable High Cross - NO pushdowns",
    description: "Tricep isolation (user prefers no pushdowns)",
    color: "bg-cyan-600",
    safetyNotes: "User preference: Avoid tricep pushdowns"
  },
  11: {
    name: "Deltoid",
    focus: "Rear/Side isolation",
    description: "Shoulder isolation with rear and side delt focus",
    color: "bg-violet-600",
    safetyNotes: null
  },
  12: {
    name: "Grip",
    focus: "Forearm burnout",
    description: "Grip strength and forearm endurance",
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
