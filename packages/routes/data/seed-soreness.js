// Soreness seed data imported from the "Soreness calendar" spreadsheet tab.
// Maps free-text descriptions to structured { group, muscle, level } entries.
// muscle is null for group-level soreness (e.g. "biceps" without specifying a head).
// Severity inferred from qualifiers: "light" → 3, "nearly faded" → 2, "very sore" → 8,
// percentage-based ("5%"→2, "25%"→3), no qualifier → 5.

export const sorenessSeedData = [
  {
    date: '2025-11-17',
    muscles: [
      { group: 'Glutes', muscle: null, level: 5 },
      { group: 'Quadriceps', muscle: null, level: 5 },
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
      { group: 'Triceps', muscle: null, level: 5 },
      { group: 'Hip & Adductors', muscle: 'Hip Adductors', level: 5 },
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 5 },
      { group: 'Lats & Back', muscle: 'Erector Spinae (Lower)', level: 5 },
    ],
  },
  {
    date: '2025-11-20',
    muscles: [
      { group: 'Triceps', muscle: null, level: 5 },
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 5 },
    ],
  },
  {
    date: '2025-11-21',
    muscles: [
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 5 },
    ],
  },
  {
    date: '2025-11-22',
    muscles: [
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 4 },
    ],
  },
  {
    date: '2025-11-23',
    muscles: [
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 3 },
    ],
  },
  {
    date: '2025-11-24',
    muscles: [
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 2 },
    ],
  },
  {
    date: '2025-11-25',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
    ],
  },
  {
    date: '2025-11-26',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-11-27',
    muscles: [
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
      { group: 'Pecs', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-11-28',
    muscles: [
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
    ],
  },
  {
    date: '2025-12-01',
    muscles: [
      { group: 'Pecs', muscle: 'Serratus Anterior', level: 5 },
    ],
  },
  {
    date: '2025-12-03',
    muscles: [
      { group: 'Pecs', muscle: 'Serratus Anterior', level: 5 },
    ],
  },
  {
    date: '2025-12-06',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
    ],
  },
  {
    date: '2025-12-07',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
      { group: 'Triceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-08',
    muscles: [
      { group: 'Triceps', muscle: null, level: 5 },
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 5 },
    ],
  },
  {
    date: '2025-12-09',
    muscles: [
      { group: 'Triceps', muscle: null, level: 5 },
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 5 },
      { group: 'Hamstrings', muscle: null, level: 5 },
      { group: 'Quadriceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-10',
    muscles: [
      { group: 'Triceps', muscle: null, level: 2 },
      { group: 'Abs & Core', muscle: 'Rectus Abdominis (Upper)', level: 2 },
      { group: 'Hamstrings', muscle: null, level: 8 },
      { group: 'Quadriceps', muscle: null, level: 5 },
      { group: 'Lats & Back', muscle: 'Erector Spinae (Lower)', level: 5 },
    ],
  },
  {
    date: '2025-12-11',
    muscles: [
      { group: 'Hamstrings', muscle: null, level: 2 },
      { group: 'Lats & Back', muscle: null, level: 5 },
      { group: 'Lats & Back', muscle: 'Erector Spinae (Lower)', level: 5 },
      { group: 'Quadriceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-12',
    muscles: [
      { group: 'Lats & Back', muscle: null, level: 2 },
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-13',
    muscles: [
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-14',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-16',
    muscles: [
      { group: 'Pecs', muscle: null, level: 5 },
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
      { group: 'Forearms & Grip', muscle: 'Pronator Teres', level: 5 },
    ],
  },
  {
    date: '2025-12-17',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
      { group: 'Forearms & Grip', muscle: 'Pronator Teres', level: 5 },
    ],
  },
  {
    date: '2025-12-18',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 5 },
      { group: 'Forearms & Grip', muscle: 'Pronator Teres', level: 5 },
    ],
  },
  {
    date: '2025-12-19',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Pronator Teres', level: 5 },
    ],
  },
  {
    date: '2025-12-22',
    muscles: [
      { group: 'Pecs', muscle: null, level: 5 },
    ],
  },
  {
    date: '2025-12-30',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 3 },
    ],
  },
  {
    date: '2025-12-31',
    muscles: [
      { group: 'Forearms & Grip', muscle: 'Wrist Flexors', level: 3 },
    ],
  },
  {
    date: '2026-01-03',
    muscles: [
      { group: 'Hamstrings', muscle: null, level: 5 },
      { group: 'Abs & Core', muscle: null, level: 5 },
      { group: 'Pecs', muscle: 'Serratus Anterior', level: 5 },
    ],
  },
  {
    date: '2026-01-04',
    muscles: [
      { group: 'Hamstrings', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-05',
    muscles: [
      { group: 'Hamstrings', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-06',
    muscles: [
      { group: 'Calves', muscle: 'Achilles Tendon', level: 5 },
      { group: 'Abs & Core', muscle: 'External Obliques', level: 5 },
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
      { group: 'Hamstrings', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-07',
    muscles: [
      { group: 'Calves', muscle: 'Achilles Tendon', level: 5 },
      { group: 'Abs & Core', muscle: 'External Obliques', level: 5 },
      { group: 'Lats & Back', muscle: 'Latissimus Dorsi', level: 5 },
      { group: 'Hamstrings', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-08',
    muscles: [
      { group: 'Calves', muscle: 'Achilles Tendon', level: 5 },
      { group: 'Abs & Core', muscle: 'External Obliques', level: 5 },
    ],
  },
  {
    date: '2026-01-22',
    muscles: [
      { group: 'Abs & Core', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-27',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-28',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-29',
    muscles: [
      { group: 'Biceps', muscle: null, level: 5 },
    ],
  },
  {
    date: '2026-01-30',
    muscles: [
      { group: 'Biceps', muscle: null, level: 3 },
      { group: 'Deltoids', muscle: null, level: 3 },
    ],
  },
  {
    date: '2026-02-15',
    muscles: [
      { group: 'Pecs', muscle: null, level: 5 },
    ],
  },
];
