// Muscle taxonomy for the soreness tracker.
// Top-level groups → specific muscles within each group.
// Each muscle has a name and a brief anatomical location hint.

export const MUSCLE_TAXONOMY = {
  'Quadriceps': {
    muscles: [
      { name: 'Rectus Femoris', location: 'Front center of thigh' },
      { name: 'Vastus Lateralis', location: 'Outer thigh' },
      { name: 'Vastus Medialis', location: 'Inner thigh (teardrop)' },
      { name: 'Vastus Intermedius', location: 'Deep center, under rectus femoris' },
    ],
  },
  'Hamstrings': {
    muscles: [
      { name: 'Biceps Femoris (Long Head)', location: 'Outer back of thigh' },
      { name: 'Biceps Femoris (Short Head)', location: 'Lower outer back of thigh' },
      { name: 'Semitendinosus', location: 'Inner back of thigh (superficial)' },
      { name: 'Semimembranosus', location: 'Inner back of thigh (deep)' },
    ],
  },
  'Glutes': {
    muscles: [
      { name: 'Gluteus Maximus', location: 'Main buttock mass' },
      { name: 'Gluteus Medius', location: 'Upper outer hip' },
      { name: 'Gluteus Minimus', location: 'Deep under medius' },
    ],
  },
  'Calves': {
    muscles: [
      { name: 'Gastrocnemius (Medial)', location: 'Inner calf bulge' },
      { name: 'Gastrocnemius (Lateral)', location: 'Outer calf bulge' },
      { name: 'Soleus', location: 'Deep/lower calf' },
      { name: 'Achilles Tendon', location: 'Tendon above heel' },
      { name: 'Tibialis Anterior', location: 'Front of shin' },
    ],
  },
  'Pecs': {
    muscles: [
      { name: 'Pectoralis Major (Clavicular)', location: 'Upper chest' },
      { name: 'Pectoralis Major (Sternal)', location: 'Mid/lower chest' },
      { name: 'Pectoralis Minor', location: 'Deep, under pec major' },
      { name: 'Serratus Anterior', location: 'Side ribs, under armpit' },
    ],
  },
  'Lats & Back': {
    muscles: [
      { name: 'Latissimus Dorsi', location: 'Wide back muscle, armpit to hip' },
      { name: 'Rhomboids', location: 'Between shoulder blades' },
      { name: 'Trapezius (Upper)', location: 'Neck to shoulder top' },
      { name: 'Trapezius (Middle)', location: 'Between shoulder blades (superficial)' },
      { name: 'Trapezius (Lower)', location: 'Mid-back, below shoulder blades' },
      { name: 'Teres Major', location: 'Below shoulder blade, outer edge' },
      { name: 'Teres Minor', location: 'Above teres major' },
      { name: 'Infraspinatus', location: 'Shoulder blade (back surface)' },
      { name: 'Erector Spinae (Upper)', location: 'Along upper spine' },
      { name: 'Erector Spinae (Lower)', location: 'Lower back along spine' },
    ],
  },
  'Deltoids': {
    muscles: [
      { name: 'Anterior Deltoid', location: 'Front of shoulder' },
      { name: 'Lateral Deltoid', location: 'Side of shoulder' },
      { name: 'Posterior Deltoid', location: 'Rear of shoulder' },
    ],
  },
  'Biceps': {
    muscles: [
      { name: 'Biceps Brachii (Long Head)', location: 'Outer upper arm' },
      { name: 'Biceps Brachii (Short Head)', location: 'Inner upper arm' },
      { name: 'Brachialis', location: 'Deep, under biceps' },
      { name: 'Brachioradialis', location: 'Top of forearm near elbow' },
    ],
  },
  'Triceps': {
    muscles: [
      { name: 'Triceps (Long Head)', location: 'Inner back of upper arm' },
      { name: 'Triceps (Lateral Head)', location: 'Outer back of upper arm' },
      { name: 'Triceps (Medial Head)', location: 'Deep, near elbow' },
    ],
  },
  'Forearms & Grip': {
    muscles: [
      { name: 'Wrist Flexors', location: 'Inner forearm' },
      { name: 'Wrist Extensors', location: 'Outer forearm' },
      { name: 'Pronator Teres', location: 'Inner elbow to mid-forearm' },
      { name: 'Supinator', location: 'Outer forearm near elbow' },
      { name: 'Finger Flexors', location: 'Deep forearm to fingers' },
    ],
  },
  'Abs & Core': {
    muscles: [
      { name: 'Rectus Abdominis (Upper)', location: 'Upper abs' },
      { name: 'Rectus Abdominis (Lower)', location: 'Lower abs' },
      { name: 'External Obliques', location: 'Side of waist (superficial)' },
      { name: 'Internal Obliques', location: 'Side of waist (deep)' },
      { name: 'Transverse Abdominis', location: 'Deep core wrap' },
    ],
  },
  'Hip & Adductors': {
    muscles: [
      { name: 'Hip Flexors (Iliopsoas)', location: 'Front of hip, deep' },
      { name: 'Hip Adductors', location: 'Inner thigh' },
      { name: 'Hip Abductors', location: 'Outer hip' },
      { name: 'Piriformis', location: 'Deep in glute, under gluteus maximus' },
    ],
  },
};

// Flat list of all group names for quick iteration
export const MUSCLE_GROUPS = Object.keys(MUSCLE_TAXONOMY);

// Search muscles by name (case-insensitive, partial match)
export function searchMuscles(query) {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  const results = [];

  for (const [group, { muscles }] of Object.entries(MUSCLE_TAXONOMY)) {
    // Match group name
    if (group.toLowerCase().includes(lower)) {
      results.push({ group, muscle: null, location: null });
    }
    // Match individual muscles
    for (const m of muscles) {
      if (m.name.toLowerCase().includes(lower) || m.location.toLowerCase().includes(lower)) {
        results.push({ group, muscle: m.name, location: m.location });
      }
    }
  }

  return results;
}
