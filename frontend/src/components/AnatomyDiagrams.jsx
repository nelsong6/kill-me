// SVG anatomy reference diagrams for each muscle group in the Synergy 12 cycle.
// Renders simplified schematic outlines with labeled muscle regions.
// Usage: <AnatomyDiagram group="Quadriceps" highlightMuscle="Rectus Femoris" />

const OUTLINE = '#3d5666';
const FILL_DEFAULT = 'rgba(34, 211, 238, 0.2)';
const FILL_HIGHLIGHT = 'rgba(34, 211, 238, 0.4)';
const LABEL_COLOR = '#96aac0';
const STROKE_WIDTH = 1.5;

const labelStyle = {
  fill: LABEL_COLOR,
  fontSize: '9px',
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 400,
};

const smallLabelStyle = {
  ...labelStyle,
  fontSize: '7.5px',
};

const titleStyle = {
  fill: '#d4e4f0',
  fontSize: '11px',
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 600,
  textAnchor: 'middle',
};

function muscleFill(name, highlightMuscle) {
  if (!highlightMuscle) return FILL_DEFAULT;
  return name.toLowerCase() === highlightMuscle.toLowerCase()
    ? FILL_HIGHLIGHT
    : FILL_DEFAULT;
}

function muscleStroke(name, highlightMuscle) {
  if (!highlightMuscle) return OUTLINE;
  return name.toLowerCase() === highlightMuscle.toLowerCase()
    ? '#22d3ee'
    : OUTLINE;
}

function muscleStrokeWidth(name, highlightMuscle) {
  if (!highlightMuscle) return STROKE_WIDTH;
  return name.toLowerCase() === highlightMuscle.toLowerCase() ? 2.2 : STROKE_WIDTH;
}

function mp(name, hl) {
  return {
    fill: muscleFill(name, hl),
    stroke: muscleStroke(name, hl),
    strokeWidth: muscleStrokeWidth(name, hl),
    strokeLinejoin: 'round',
  };
}

// ── Quadriceps (front thigh view) ──
function QuadsDiagram({ hl }) {
  return (
    <g>
      {/* Outer thigh outline */}
      <path
        d="M60,40 L50,60 L45,100 L42,140 L40,180 L42,220 L50,250 L55,260 L145,260 L150,250 L158,220 L160,180 L158,140 L155,100 L150,60 L140,40 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Rectus Femoris — center */}
      <path
        d="M85,55 Q80,70 78,100 Q76,140 77,180 Q78,210 82,240 L88,250 L112,250 L118,240 Q122,210 123,180 Q124,140 122,100 Q120,70 115,55 Z"
        {...mp('Rectus Femoris', hl)}
      />
      <text x="100" y="155" textAnchor="middle" style={smallLabelStyle}>Rectus</text>
      <text x="100" y="165" textAnchor="middle" style={smallLabelStyle}>Femoris</text>

      {/* Vastus Lateralis — outer */}
      <path
        d="M60,50 Q55,70 50,100 Q46,140 45,180 Q46,210 50,240 L58,255 L82,250 Q78,210 77,180 Q76,140 78,100 Q80,70 85,55 Z"
        {...mp('Vastus Lateralis', hl)}
      />
      <text x="55" y="130" textAnchor="middle" style={smallLabelStyle}>Vastus</text>
      <text x="55" y="140" textAnchor="middle" style={smallLabelStyle}>Lateralis</text>

      {/* Vastus Medialis — inner */}
      <path
        d="M140,50 Q145,70 150,100 Q154,140 155,180 Q154,210 150,240 L142,255 L118,250 Q122,210 123,180 Q124,140 122,100 Q120,70 115,55 Z"
        {...mp('Vastus Medialis', hl)}
      />
      <text x="145" y="130" textAnchor="middle" style={smallLabelStyle}>Vastus</text>
      <text x="145" y="140" textAnchor="middle" style={smallLabelStyle}>Medialis</text>

      {/* Vastus Intermedius label (hidden beneath rectus) */}
      <line x1="100" y1="200" x2="100" y2="218" stroke={LABEL_COLOR} strokeWidth={0.5} strokeDasharray="2,2" />
      <text x="100" y="228" textAnchor="middle" style={smallLabelStyle}>(V. Intermedius</text>
      <text x="100" y="238" textAnchor="middle" style={smallLabelStyle}>beneath)</text>

      {/* Kneecap reference */}
      <ellipse cx="100" cy="264" rx="14" ry="8" fill="none" stroke={OUTLINE} strokeWidth={0.8} opacity={0.5} />
      <text x="100" y="282" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.5 }}>patella</text>
    </g>
  );
}

// ── Hamstrings (back thigh view) ──
function HamstringsDiagram({ hl }) {
  return (
    <g>
      {/* Outer thigh outline — posterior */}
      <path
        d="M60,30 L50,50 L45,90 L42,140 L40,190 L42,230 L55,260 L145,260 L158,230 L160,190 L158,140 L155,90 L150,50 L140,30 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Biceps Femoris — lateral */}
      <path
        d="M60,40 Q55,60 52,90 Q48,130 47,170 Q48,200 52,230 L62,255 L88,255 Q86,220 86,190 Q87,150 90,110 Q92,80 95,55 Z"
        {...mp('Biceps Femoris', hl)}
      />
      <text x="68" y="145" textAnchor="middle" style={smallLabelStyle}>Biceps</text>
      <text x="68" y="155" textAnchor="middle" style={smallLabelStyle}>Femoris</text>

      {/* Semitendinosus — medial */}
      <path
        d="M140,40 Q145,60 148,90 Q152,130 153,170 Q152,200 148,230 L138,255 L112,255 Q114,220 114,190 Q113,150 110,110 Q108,80 105,55 Z"
        {...mp('Semitendinosus', hl)}
      />
      <text x="135" y="145" textAnchor="middle" style={smallLabelStyle}>Semi-</text>
      <text x="135" y="155" textAnchor="middle" style={smallLabelStyle}>tendinosus</text>

      {/* Semimembranosus — deep medial */}
      <path
        d="M105,55 Q103,80 100,110 Q97,150 96,190 Q96,220 98,248 L103,255 L112,255 Q114,220 114,190 Q113,150 110,110 Q108,80 105,55 Z"
        {...mp('Semimembranosus', hl)}
      />
      {/* Central dividing line hint */}
      <path
        d="M95,55 Q93,80 90,110 Q87,150 86,190 Q86,220 88,248 L93,255 L98,248 Q96,220 96,190 Q97,150 100,110 Q103,80 105,55 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.5}
        strokeDasharray="3,3"
        opacity={0.4}
      />
      <text x="100" y="210" textAnchor="middle" style={smallLabelStyle}>Semi-</text>
      <text x="100" y="220" textAnchor="middle" style={smallLabelStyle}>membranosus</text>

      {/* Glute reference at top */}
      <path
        d="M60,30 Q80,20 100,18 Q120,20 140,30"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.8}
        strokeDasharray="3,2"
        opacity={0.4}
      />
      <text x="100" y="14" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.4 }}>glute</text>
    </g>
  );
}

// ── Glutes (posterior hip view) ──
function GlutesDiagram({ hl }) {
  return (
    <g>
      {/* Pelvis outline */}
      <path
        d="M30,80 Q40,40 70,30 Q100,25 130,30 Q160,40 170,80 L170,100 Q160,120 140,130 L60,130 Q40,120 30,100 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Gluteus Maximus */}
      <path
        d="M40,85 Q45,55 75,42 Q100,38 125,42 Q155,55 160,85 Q160,110 148,125 Q130,140 100,145 Q70,140 52,125 Q40,110 40,85 Z"
        {...mp('Gluteus Maximus', hl)}
      />
      <text x="100" y="100" textAnchor="middle" style={labelStyle}>Gluteus Maximus</text>

      {/* Gluteus Medius — upper fan */}
      <path
        d="M45,70 Q50,45 80,35 Q100,32 120,35 Q150,45 155,70 Q140,60 100,55 Q60,60 45,70 Z"
        {...mp('Gluteus Medius', hl)}
      />
      <text x="100" y="50" textAnchor="middle" style={smallLabelStyle}>Gluteus Medius</text>

      {/* Gluteus Minimus — deeper, shown as dashed outline */}
      <path
        d="M60,65 Q70,50 100,47 Q130,50 140,65"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.8}
        strokeDasharray="3,2"
        opacity={0.6}
      />
      <text x="100" y="68" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.6 }}>(Glut. Minimus)</text>

      {/* Upper thigh references */}
      <path d="M55,145 L50,200 Q48,230 55,260" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <path d="M145,145 L150,200 Q152,230 145,260" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />

      {/* Spine reference */}
      <line x1="100" y1="20" x2="100" y2="32" stroke={OUTLINE} strokeWidth={0.8} opacity={0.3} />
      <text x="100" y="16" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>spine</text>
    </g>
  );
}

// ── Calves (posterior lower leg) ──
function CalvesDiagram({ hl }) {
  return (
    <g>
      {/* Lower leg outline */}
      <path
        d="M65,30 L60,50 Q55,80 58,120 Q65,160 70,190 Q72,220 75,250 L80,270 L120,270 L125,250 Q128,220 130,190 Q135,160 142,120 Q145,80 140,50 L135,30 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Gastrocnemius — medial head */}
      <path
        d="M75,35 Q68,55 65,80 Q62,110 65,140 Q68,165 75,185 L95,185 Q92,160 90,135 Q88,110 90,80 Q92,55 95,35 Z"
        {...mp('Gastrocnemius Medial', hl)}
      />
      <text x="72" y="110" textAnchor="middle" style={smallLabelStyle}>Gastroc.</text>
      <text x="72" y="120" textAnchor="middle" style={smallLabelStyle}>(medial)</text>

      {/* Gastrocnemius — lateral head */}
      <path
        d="M105,35 Q108,55 110,80 Q112,110 110,135 Q108,160 105,185 L125,185 Q132,165 135,140 Q138,110 135,80 Q132,55 125,35 Z"
        {...mp('Gastrocnemius Lateral', hl)}
      />
      <text x="132" y="110" textAnchor="middle" style={smallLabelStyle}>Gastroc.</text>
      <text x="132" y="120" textAnchor="middle" style={smallLabelStyle}>(lateral)</text>

      {/* Soleus — deeper, visible on sides */}
      <path
        d="M72,160 Q70,190 73,220 Q76,240 80,255 L120,255 Q124,240 127,220 Q130,190 128,160 L115,170 Q105,175 95,175 Q85,175 75,170 Z"
        {...mp('Soleus', hl)}
      />
      <text x="100" y="220" textAnchor="middle" style={labelStyle}>Soleus</text>

      {/* Central division line between gastroc heads */}
      <path
        d="M100,38 Q98,80 98,120 Q99,150 100,180"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.8}
        opacity={0.5}
      />

      {/* Achilles tendon */}
      <path
        d="M95,255 Q100,265 100,275 Q100,285 100,290"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1.2}
        opacity={0.5}
      />
      <path
        d="M105,255 Q100,265 100,275 Q100,285 100,290"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1.2}
        opacity={0.5}
      />
      <text x="100" y="298" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.5 }}>Achilles</text>

      {/* Knee reference */}
      <text x="100" y="26" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>knee</text>
    </g>
  );
}

// ── Pecs (anterior chest) ──
function PecsDiagram({ hl }) {
  return (
    <g>
      {/* Ribcage outline */}
      <path
        d="M40,60 Q45,40 70,30 L100,25 L130,30 Q155,40 160,60 L165,100 Q165,140 155,170 L100,185 L45,170 Q35,140 35,100 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Pectoralis Major — left */}
      <path
        d="M50,55 Q55,42 75,35 L97,32 L97,100 Q95,115 90,128 Q82,140 68,148 Q55,140 48,120 Q42,100 42,80 Z"
        {...mp('Pectoralis Major', hl)}
      />

      {/* Pectoralis Major — right */}
      <path
        d="M150,55 Q145,42 125,35 L103,32 L103,100 Q105,115 110,128 Q118,140 132,148 Q145,140 152,120 Q158,100 158,80 Z"
        {...mp('Pectoralis Major', hl)}
      />
      <text x="100" y="95" textAnchor="middle" style={labelStyle}>Pectoralis Major</text>

      {/* Pectoralis Minor — outline behind, shown dashed */}
      <path
        d="M60,58 Q70,48 85,44 L97,50 L97,80 Q88,90 75,95 Q65,88 60,75 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      <path
        d="M140,58 Q130,48 115,44 L103,50 L103,80 Q112,90 125,95 Q135,88 140,75 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      <text x="100" y="115" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.6 }}>(Pec. Minor beneath)</text>

      {/* Clavicle line */}
      <path
        d="M40,38 Q70,28 100,25 Q130,28 160,38"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.5}
      />
      <text x="100" y="20" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.4 }}>clavicle</text>

      {/* Sternum */}
      <line x1="100" y1="30" x2="100" y2="165" stroke={OUTLINE} strokeWidth={1} opacity={0.4} />
      <text x="100" y="175" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.4 }}>sternum</text>

      {/* Shoulder references */}
      <circle cx="35" cy="50" r="10" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <circle cx="165" cy="50" r="10" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
    </g>
  );
}

// ── Lats & Back (posterior torso) ──
function BackDiagram({ hl }) {
  return (
    <g>
      {/* Torso outline */}
      <path
        d="M35,30 Q50,20 75,18 L100,16 L125,18 Q150,20 165,30 L170,60 L172,100 Q170,140 162,170 L150,200 L100,210 L50,200 L38,170 Q30,140 28,100 L30,60 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Latissimus Dorsi — left */}
      <path
        d="M38,65 Q35,90 34,120 Q36,155 42,180 L55,195 L95,200 L95,120 Q90,100 80,85 Q68,70 50,62 Z"
        {...mp('Latissimus Dorsi', hl)}
      />

      {/* Latissimus Dorsi — right */}
      <path
        d="M162,65 Q165,90 166,120 Q164,155 158,180 L145,195 L105,200 L105,120 Q110,100 120,85 Q132,70 150,62 Z"
        {...mp('Latissimus Dorsi', hl)}
      />
      <text x="60" y="155" textAnchor="middle" style={labelStyle}>Lat</text>
      <text x="140" y="155" textAnchor="middle" style={labelStyle}>Lat</text>

      {/* Trapezius — upper */}
      <path
        d="M65,22 Q80,18 100,16 Q120,18 135,22 L148,35 Q130,50 100,55 Q70,50 52,35 Z"
        {...mp('Trapezius', hl)}
      />
      <text x="100" y="40" textAnchor="middle" style={smallLabelStyle}>Trapezius</text>

      {/* Rhomboids — between spine and scapula */}
      <path
        d="M82,50 L95,48 L95,95 L82,100 Q78,80 80,65 Z"
        {...mp('Rhomboids', hl)}
      />
      <path
        d="M118,50 L105,48 L105,95 L118,100 Q122,80 120,65 Z"
        {...mp('Rhomboids', hl)}
      />
      <text x="100" y="78" textAnchor="middle" style={smallLabelStyle}>Rhomboids</text>

      {/* Erector Spinae — along spine */}
      <path
        d="M92,90 L95,90 L95,190 Q94,195 92,195 Z"
        {...mp('Erector Spinae', hl)}
      />
      <path
        d="M108,90 L105,90 L105,190 Q106,195 108,195 Z"
        {...mp('Erector Spinae', hl)}
      />
      <text x="100" y="120" textAnchor="middle" style={smallLabelStyle}>Erectors</text>

      {/* Spine reference */}
      <line x1="100" y1="16" x2="100" y2="210" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} strokeDasharray="4,3" />

      {/* Scapula outlines */}
      <path d="M55,45 L80,42 L82,100 L60,108 Q50,90 52,60 Z" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <path d="M145,45 L120,42 L118,100 L140,108 Q150,90 148,60 Z" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
    </g>
  );
}

// ── Deltoids (shoulder view, front-facing) ──
function DeltoidsDiagram({ hl }) {
  return (
    <g>
      {/* Shoulder/upper arm outline */}
      <path
        d="M50,100 Q30,90 20,70 Q15,50 25,35 Q40,18 65,15 Q90,14 100,20 Q110,14 135,15 Q160,18 175,35 Q185,50 180,70 Q170,90 150,100 L155,140 L160,200 L150,200 L140,140 L130,110 L100,105 L70,110 L60,140 L50,200 L40,200 L45,140 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Anterior Deltoid — front */}
      <path
        d="M70,28 Q85,20 100,22 L100,65 Q92,75 82,80 Q72,78 64,70 Q55,58 55,45 Q58,32 70,28 Z"
        {...mp('Anterior Deltoid', hl)}
      />
      <text x="78" y="55" textAnchor="middle" style={smallLabelStyle}>Anterior</text>

      {/* Lateral Deltoid — side (left) */}
      <path
        d="M40,40 Q35,55 38,70 Q42,82 50,90 Q58,80 64,70 Q55,58 55,45 Q50,32 45,30 Q42,33 40,40 Z"
        {...mp('Lateral Deltoid', hl)}
      />
      <text x="42" y="68" textAnchor="end" style={smallLabelStyle}>Lateral</text>

      {/* Anterior Deltoid — front (right) */}
      <path
        d="M130,28 Q115,20 100,22 L100,65 Q108,75 118,80 Q128,78 136,70 Q145,58 145,45 Q142,32 130,28 Z"
        {...mp('Anterior Deltoid', hl)}
      />

      {/* Lateral Deltoid — side (right) */}
      <path
        d="M160,40 Q165,55 162,70 Q158,82 150,90 Q142,80 136,70 Q145,58 145,45 Q150,32 155,30 Q158,33 160,40 Z"
        {...mp('Lateral Deltoid', hl)}
      />
      <text x="158" y="68" textAnchor="start" style={smallLabelStyle}>Lateral</text>

      {/* Posterior Deltoid label (behind, dashed) */}
      <path
        d="M50,42 Q48,55 52,68"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        strokeDasharray="2,2"
        opacity={0.5}
      />
      <text x="32" y="80" style={{ ...smallLabelStyle, opacity: 0.5 }}>Posterior</text>
      <text x="32" y="89" style={{ ...smallLabelStyle, opacity: 0.5 }}>(rear)</text>

      {/* Clavicle/acromion reference */}
      <path
        d="M65,22 Q80,16 100,15 Q120,16 135,22"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.8}
        opacity={0.4}
      />
      <text x="100" y="11" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.4 }}>acromion</text>

      {/* Upper arm reference lines */}
      <line x1="60" y1="100" x2="50" y2="180" stroke={OUTLINE} strokeWidth={0.5} opacity={0.3} />
      <line x1="140" y1="100" x2="150" y2="180" stroke={OUTLINE} strokeWidth={0.5} opacity={0.3} />
    </g>
  );
}

// ── Biceps (anterior upper arm) ──
function BicepsDiagram({ hl }) {
  return (
    <g>
      {/* Arm outline */}
      <path
        d="M65,30 Q55,35 50,50 L45,80 Q40,120 42,160 Q44,190 48,220 L55,250 Q60,258 75,260 L125,260 Q140,258 145,250 L152,220 Q156,190 158,160 Q160,120 155,80 L150,50 Q145,35 135,30 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Biceps Long Head */}
      <path
        d="M72,42 Q65,55 60,80 Q56,110 56,140 Q56,165 60,185 Q64,200 70,210 L90,212 Q88,195 86,175 Q84,150 84,120 Q84,90 88,65 Q90,50 92,42 Z"
        {...mp('Long Head', hl)}
      />
      <text x="70" y="130" textAnchor="middle" style={smallLabelStyle}>Long</text>
      <text x="70" y="140" textAnchor="middle" style={smallLabelStyle}>Head</text>

      {/* Biceps Short Head */}
      <path
        d="M108,42 Q110,50 112,65 Q116,90 116,120 Q116,150 114,175 Q112,195 110,212 L130,210 Q136,200 140,185 Q144,165 144,140 Q144,110 140,80 Q135,55 128,42 Z"
        {...mp('Short Head', hl)}
      />
      <text x="132" y="130" textAnchor="middle" style={smallLabelStyle}>Short</text>
      <text x="132" y="140" textAnchor="middle" style={smallLabelStyle}>Head</text>

      {/* Brachialis — beneath, visible on sides */}
      <path
        d="M55,180 Q52,200 52,215 Q54,230 60,242 L75,248 L125,248 L140,242 Q146,230 148,215 Q148,200 145,180 Q135,195 120,200 Q100,205 80,200 Q65,195 55,180 Z"
        {...mp('Brachialis', hl)}
      />
      <text x="100" y="235" textAnchor="middle" style={smallLabelStyle}>Brachialis</text>

      {/* Bicep peak area */}
      <path
        d="M84,120 Q90,105 100,100 Q110,105 116,120"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.6}
        opacity={0.5}
      />
      <text x="100" y="96" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.5 }}>peak</text>

      {/* Shoulder reference */}
      <ellipse cx="100" cy="30" rx="40" ry="8" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <text x="100" y="20" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>shoulder</text>

      {/* Elbow reference */}
      <text x="100" y="272" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>elbow</text>
    </g>
  );
}

// ── Triceps (posterior upper arm) ──
function TricepsDiagram({ hl }) {
  return (
    <g>
      {/* Arm outline */}
      <path
        d="M65,30 Q55,35 50,50 L45,80 Q40,120 42,160 Q44,190 48,220 L55,250 Q60,258 75,260 L125,260 Q140,258 145,250 L152,220 Q156,190 158,160 Q160,120 155,80 L150,50 Q145,35 135,30 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Long Head — center/inner */}
      <path
        d="M85,40 Q80,60 78,90 Q76,130 78,170 Q80,200 84,225 L95,230 L105,230 L116,225 Q120,200 122,170 Q124,130 122,90 Q120,60 115,40 Z"
        {...mp('Long Head', hl)}
      />
      <text x="100" y="100" textAnchor="middle" style={smallLabelStyle}>Long</text>
      <text x="100" y="110" textAnchor="middle" style={smallLabelStyle}>Head</text>

      {/* Lateral Head — outer */}
      <path
        d="M65,45 Q58,60 54,90 Q50,120 50,150 Q52,180 56,205 L65,230 L84,225 Q80,200 78,170 Q76,130 78,90 Q80,60 85,40 Z"
        {...mp('Lateral Head', hl)}
      />
      <text x="58" y="145" textAnchor="middle" style={smallLabelStyle}>Lateral</text>
      <text x="58" y="155" textAnchor="middle" style={smallLabelStyle}>Head</text>

      {/* Medial Head — deep, visible near elbow */}
      <path
        d="M78,185 Q76,205 78,225 L84,240 L116,240 L122,225 Q124,205 122,185 Q115,195 100,198 Q85,195 78,185 Z"
        {...mp('Medial Head', hl)}
      />
      <text x="100" y="232" textAnchor="middle" style={smallLabelStyle}>Medial Head</text>

      {/* Horseshoe shape indicator */}
      <path
        d="M70,160 Q68,180 72,200 Q80,215 100,220 Q120,215 128,200 Q132,180 130,160"
        fill="none"
        stroke="#22d3ee"
        strokeWidth={0.5}
        strokeDasharray="3,2"
        opacity={0.3}
      />
      <text x="100" y="175" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.4 }}>horseshoe</text>

      {/* Shoulder reference */}
      <ellipse cx="100" cy="30" rx="40" ry="8" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />

      {/* Olecranon / elbow */}
      <ellipse cx="100" cy="252" rx="12" ry="6" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.4} />
      <text x="100" y="272" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>olecranon</text>
    </g>
  );
}

// ── Forearms & Grip (anterior forearm) ──
function ForearmsDiagram({ hl }) {
  return (
    <g>
      {/* Forearm outline */}
      <path
        d="M60,30 Q52,40 48,60 Q44,90 42,120 Q40,160 42,200 Q44,230 48,255 L55,270 Q60,278 70,280 L130,280 Q140,278 145,270 L152,255 Q156,230 158,200 Q160,160 158,120 Q156,90 152,60 Q148,40 140,30 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Brachioradialis — lateral */}
      <path
        d="M62,35 Q55,50 52,75 Q48,110 48,150 Q50,180 54,205 L60,215 L78,210 Q76,185 75,155 Q74,120 76,85 Q78,55 82,38 Z"
        {...mp('Brachioradialis', hl)}
      />
      <text x="55" y="125" textAnchor="middle" style={smallLabelStyle}>Brachio-</text>
      <text x="55" y="135" textAnchor="middle" style={smallLabelStyle}>radialis</text>

      {/* Wrist Flexors — medial group */}
      <path
        d="M118,38 Q122,55 124,85 Q126,120 126,155 Q124,185 122,210 L140,215 Q146,205 150,180 Q152,150 152,120 Q152,90 148,65 Q145,45 138,35 Z"
        {...mp('Wrist Flexors', hl)}
      />
      <text x="142" y="125" textAnchor="middle" style={smallLabelStyle}>Wrist</text>
      <text x="142" y="135" textAnchor="middle" style={smallLabelStyle}>Flexors</text>

      {/* Wrist Extensors — deep/posterior, shown central */}
      <path
        d="M82,50 Q86,70 88,100 Q90,135 90,170 Q88,200 86,220 L114,220 Q112,200 110,170 Q110,135 112,100 Q114,70 118,50 Z"
        {...mp('Wrist Extensors', hl)}
      />
      <text x="100" y="140" textAnchor="middle" style={smallLabelStyle}>Extensors</text>

      {/* Finger flexors in palm area */}
      <path
        d="M65,250 Q70,260 80,268 L120,268 Q130,260 135,250 Q125,258 100,260 Q75,258 65,250 Z"
        {...mp('Finger Flexors', hl)}
      />
      <text x="100" y="265" textAnchor="middle" style={{ ...smallLabelStyle, fontSize: '6.5px' }}>Finger Flexors</text>

      {/* Elbow reference */}
      <ellipse cx="100" cy="30" rx="35" ry="7" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <text x="100" y="20" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>elbow</text>

      {/* Wrist reference */}
      <line x1="60" y1="245" x2="140" y2="245" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <text x="100" y="290" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>wrist</text>
    </g>
  );
}

// ── Abs & Core (anterior torso) ──
function AbsDiagram({ hl }) {
  return (
    <g>
      {/* Torso outline */}
      <path
        d="M40,25 Q60,18 100,15 Q140,18 160,25 L168,50 Q172,80 170,120 Q168,160 162,190 L150,220 Q130,240 100,245 Q70,240 50,220 L38,190 Q32,160 30,120 Q28,80 32,50 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Rectus Abdominis — the six-pack */}
      <path
        d="M84,35 L84,220 Q90,228 100,230 Q110,228 116,220 L116,35 Q110,30 100,28 Q90,30 84,35 Z"
        {...mp('Rectus Abdominis', hl)}
      />
      {/* Six-pack divisions */}
      <line x1="84" y1="68" x2="116" y2="68" stroke={OUTLINE} strokeWidth={0.8} opacity={0.6} />
      <line x1="84" y1="102" x2="116" y2="102" stroke={OUTLINE} strokeWidth={0.8} opacity={0.6} />
      <line x1="84" y1="136" x2="116" y2="136" stroke={OUTLINE} strokeWidth={0.8} opacity={0.6} />
      <line x1="84" y1="170" x2="116" y2="170" stroke={OUTLINE} strokeWidth={0.8} opacity={0.6} />
      {/* Linea alba */}
      <line x1="100" y1="30" x2="100" y2="225" stroke={OUTLINE} strokeWidth={0.6} opacity={0.5} />
      <text x="100" y="88" textAnchor="middle" style={smallLabelStyle}>Rectus</text>
      <text x="100" y="98" textAnchor="middle" style={smallLabelStyle}>Abdominis</text>

      {/* External Obliques — left */}
      <path
        d="M42,50 Q38,80 36,120 Q38,160 44,190 L55,215 Q65,225 78,228 L84,220 L84,45 Q70,38 55,40 Z"
        {...mp('External Obliques', hl)}
      />
      <text x="58" y="130" textAnchor="middle" style={smallLabelStyle}>External</text>
      <text x="58" y="140" textAnchor="middle" style={smallLabelStyle}>Oblique</text>

      {/* External Obliques — right */}
      <path
        d="M158,50 Q162,80 164,120 Q162,160 156,190 L145,215 Q135,225 122,228 L116,220 L116,45 Q130,38 145,40 Z"
        {...mp('External Obliques', hl)}
      />
      <text x="142" y="130" textAnchor="middle" style={smallLabelStyle}>External</text>
      <text x="142" y="140" textAnchor="middle" style={smallLabelStyle}>Oblique</text>

      {/* Transverse Abdominis — dashed, deep layer */}
      <path
        d="M50,100 Q60,108 80,112 Q100,114 120,112 Q140,108 150,100"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        strokeDasharray="3,2"
        opacity={0.4}
      />
      <text x="100" y="155" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.5 }}>(Transverse Abd.</text>
      <text x="100" y="164" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.5 }}>deep layer)</text>

      {/* Rib cage reference */}
      <path d="M50,35 Q75,25 100,23 Q125,25 150,35" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
      <text x="100" y="18" textAnchor="middle" style={{ ...smallLabelStyle, opacity: 0.3 }}>ribcage</text>

      {/* Pelvis reference */}
      <path d="M55,218 Q75,235 100,238 Q125,235 145,218" fill="none" stroke={OUTLINE} strokeWidth={0.6} opacity={0.3} />
    </g>
  );
}

// ── Hip & Adductors (inner thigh / hip area, frontal view) ──
function HipDiagram({ hl }) {
  return (
    <g>
      {/* Pelvis outline */}
      <path
        d="M25,50 Q30,25 55,15 Q80,10 100,10 Q120,10 145,15 Q170,25 175,50 L178,80 Q175,110 165,130 L155,145 L100,180 L45,145 L35,130 Q25,110 22,80 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Adductor Magnus — large inner thigh */}
      <path
        d="M80,110 L75,140 Q72,170 70,200 Q68,230 70,260 L85,265 L100,268 L115,265 L130,260 Q132,230 130,200 Q128,170 125,140 L120,110 Q110,125 100,130 Q90,125 80,110 Z"
        {...mp('Adductor Magnus', hl)}
      />
      <text x="100" y="210" textAnchor="middle" style={labelStyle}>Adductor</text>
      <text x="100" y="222" textAnchor="middle" style={labelStyle}>Magnus</text>

      {/* Adductor Longus — more superficial */}
      <path
        d="M85,105 Q82,115 80,130 L78,160 Q80,180 82,195 L100,200 L118,195 Q120,180 122,160 L120,130 Q118,115 115,105 Q108,115 100,118 Q92,115 85,105 Z"
        {...mp('Adductor Longus', hl)}
      />
      <text x="100" y="160" textAnchor="middle" style={smallLabelStyle}>Add. Longus</text>

      {/* Iliopsoas (hip flexor) — left */}
      <path
        d="M65,30 Q60,45 58,65 Q58,80 62,95 Q70,105 80,110 Q88,100 90,85 Q90,65 88,48 Q85,35 78,25 Z"
        {...mp('Iliopsoas', hl)}
      />
      <text x="70" y="72" textAnchor="middle" style={smallLabelStyle}>Ilio-</text>
      <text x="70" y="82" textAnchor="middle" style={smallLabelStyle}>psoas</text>

      {/* Iliopsoas — right */}
      <path
        d="M135,30 Q140,45 142,65 Q142,80 138,95 Q130,105 120,110 Q112,100 110,85 Q110,65 112,48 Q115,35 122,25 Z"
        {...mp('Iliopsoas', hl)}
      />
      <text x="130" y="72" textAnchor="middle" style={smallLabelStyle}>Ilio-</text>
      <text x="130" y="82" textAnchor="middle" style={smallLabelStyle}>psoas</text>

      {/* Gracilis — thin medial line */}
      <path
        d="M96,130 Q94,170 94,210 Q94,240 96,265 L104,265 Q106,240 106,210 Q106,170 104,130 Z"
        {...mp('Gracilis', hl)}
      />
      <text x="100" y="248" textAnchor="middle" style={smallLabelStyle}>Gracilis</text>

      {/* Pelvic bone references */}
      <path
        d="M35,40 Q45,22 70,15 Q85,12 100,11"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        opacity={0.3}
      />
      <path
        d="M165,40 Q155,22 130,15 Q115,12 100,11"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={0.7}
        opacity={0.3}
      />
      <text x="40" y="12" style={{ ...smallLabelStyle, opacity: 0.3 }}>iliac crest</text>

      {/* Leg direction references */}
      <path d="M70,260 L65,290" fill="none" stroke={OUTLINE} strokeWidth={0.5} opacity={0.2} />
      <path d="M130,260 L135,290" fill="none" stroke={OUTLINE} strokeWidth={0.5} opacity={0.2} />
    </g>
  );
}

// ── Group name → diagram component mapping ──
const DIAGRAM_MAP = {
  'Quadriceps': QuadsDiagram,
  'Hamstrings': HamstringsDiagram,
  'Glutes': GlutesDiagram,
  'Calves': CalvesDiagram,
  'Pecs': PecsDiagram,
  'Lats & Back': BackDiagram,
  'Deltoids': DeltoidsDiagram,
  'Biceps': BicepsDiagram,
  'Triceps': TricepsDiagram,
  'Forearms & Grip': ForearmsDiagram,
  'Abs & Core': AbsDiagram,
  'Hip & Adductors': HipDiagram,
};

const GROUP_TITLES = {
  'Quadriceps': 'Quadriceps — Anterior Thigh',
  'Hamstrings': 'Hamstrings — Posterior Thigh',
  'Glutes': 'Glutes — Posterior Hip',
  'Calves': 'Calves — Posterior Lower Leg',
  'Pecs': 'Pectorals — Anterior Chest',
  'Lats & Back': 'Lats & Back — Posterior Torso',
  'Deltoids': 'Deltoids — Shoulder',
  'Biceps': 'Biceps — Anterior Upper Arm',
  'Triceps': 'Triceps — Posterior Upper Arm',
  'Forearms & Grip': 'Forearms — Anterior Forearm',
  'Abs & Core': 'Abs & Core — Anterior Torso',
  'Hip & Adductors': 'Hip & Adductors — Inner Thigh',
};

export function AnatomyDiagram({ group, highlightMuscle }) {
  const DiagramComponent = DIAGRAM_MAP[group];

  if (!DiagramComponent) {
    return (
      <svg viewBox="0 0 200 300" style={{ width: '100%', maxWidth: 280 }}>
        <text x="100" y="150" textAnchor="middle" style={labelStyle}>
          No diagram for "{group}"
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 300"
      style={{
        width: '100%',
        maxWidth: 280,
        background: 'transparent',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="100" y="12" style={titleStyle}>
        {GROUP_TITLES[group] || group}
      </text>
      <g transform="translate(0, 5)">
        <DiagramComponent hl={highlightMuscle} />
      </g>
    </svg>
  );
}

export default AnatomyDiagram;
