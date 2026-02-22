import { getDayInfo } from '../utils/dayConfig';

export default function DayCard({ dayNumber }) {
  const dayInfo = getDayInfo(dayNumber);

  if (!dayInfo) return null;

  return (
    <div className={`${dayInfo.color} rounded-2xl p-8 shadow-2xl border border-white/20 backdrop-blur-md bg-opacity-90 relative overflow-hidden`}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-7xl font-black text-white drop-shadow-2xl">DAY {dayNumber}</h1>
          <div className="text-right">
            <div className="text-3xl font-bold text-white drop-shadow-lg">{dayInfo.name}</div>
            <div className="text-base text-white/90 font-medium">{dayInfo.focus}</div>
          </div>
        </div>
      
        <p className="text-white/90 mb-6 text-lg">{dayInfo.description}</p>

        {dayInfo.safetyNotes && (
          <div className="bg-red-900/30 backdrop-blur-sm border-2 border-red-400/80 rounded-xl p-5 mb-6 shadow-lg shadow-red-500/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-black text-red-200 mb-2 text-lg">SAFETY WARNING</h3>
                <p className="text-red-100 font-medium">{dayInfo.safetyNotes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-bold text-white/90 mb-3 uppercase tracking-wider">Suggested Exercises:</h3>
          <div className="flex flex-wrap gap-2">
            {dayInfo.exercises.map((exercise, idx) => (
              <span 
                key={idx}
                className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20 hover:bg-white/30 transition-all"
              >
                {exercise}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
