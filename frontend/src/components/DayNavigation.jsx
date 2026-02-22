export default function DayNavigation({ currentDay, onDayChange, onAdvanceDay }) {
  const days = Array.from({ length: 12 }, (_, i) => i + 1);
  const progress = (currentDay / 12) * 100;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-700/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Cycle Progress</h2>
        <button
          onClick={onAdvanceDay}
          className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-black px-8 py-4 rounded-xl font-black uppercase tracking-wide transition-all hover:scale-105 shadow-2xl shadow-green-500/50 hover:shadow-green-400/60 w-full sm:w-auto"
        >
          ✓ Complete & Advance
        </button>
      </div>

      {/* Glowing Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
          <span>Day {currentDay} of 12</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {days.map(day => {
          const isActive = currentDay === day;
          const isCompleted = day < currentDay;
          
          return (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              className={`
                aspect-square rounded-xl font-black text-lg transition-all backdrop-blur-sm
                ${isActive 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ring-4 ring-blue-400/50 scale-110 shadow-2xl shadow-blue-500/50' 
                  : isCompleted
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:bg-slate-700/50 hover:text-slate-300'
                }
              `}
            >
              {isCompleted ? '✓' : day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
