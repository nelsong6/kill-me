// Treadmill interval templates — frontend constants for phase 1.
//
// Each template defines a sequence of walk/jog intervals. The full interval
// array is stored in each logged cardio-session document so history remains
// self-contained even if templates change later.
//
// templateId is stored in the Cosmos document for forward compatibility —
// when templates move to the database, historical sessions still work because
// they store the full interval array, not just a reference.

export const TREADMILL_TEMPLATES = [
  {
    id: 'walk-jog-5x-54',
    name: 'Walk/Jog 5×5.4 + 1×6.0',
    description: '2 min walk / 4 min jog @ 5.4 mph × 5, then 4 min @ 6.0, cooldown',
    intervals: [
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 5.4, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 5.4, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 5.4, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 5.4, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 5.4, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
      { type: 'jog',  speedMph: 6.0, durationMinutes: 4 },
      { type: 'walk', speedMph: 2.0, durationMinutes: 2 },
    ],
  },
];

// Total duration of all intervals in a template (minutes)
export function getTotalDuration(intervals) {
  return intervals.reduce((sum, i) => sum + i.durationMinutes, 0);
}

// Human-readable summary of a template's intervals
export function formatIntervalSummary(intervals) {
  const jogCount = intervals.filter(i => i.type === 'jog').length;
  const totalMin = getTotalDuration(intervals);
  return `${jogCount} jog intervals, ${totalMin} min`;
}
