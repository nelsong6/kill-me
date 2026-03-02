import { useState } from 'react';
import { getDayInfo } from '../utils/dayConfig';

export default function WorkoutHistory({ workouts, onDeleteWorkout }) {
  const [filterDay, setFilterDay] = useState('all');

  const filteredWorkouts = filterDay === 'all' 
    ? workouts 
    : workouts.filter(w => w.day === parseInt(filterDay));

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (workouts.length === 0) {
    return (
      <div>
        <h2 className="text-4xl font-black text-slate-100 mb-8 flex items-center gap-4 uppercase tracking-wide">
          <span className="text-5xl">📊</span>
          History
        </h2>
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-dashed border-slate-700">
          <div className="text-8xl mb-6 opacity-50">🏋️</div>
          <p className="text-slate-300 text-2xl font-bold mb-3">No Workouts Yet</p>
          <p className="text-slate-500 text-lg">Start your journey by logging your first session</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-4xl font-black text-slate-100 flex items-center gap-4 uppercase tracking-wide">
          <span className="text-5xl">📊</span>
          History
        </h2>
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="bg-slate-800/60 backdrop-blur-md text-slate-200 rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
        >
          <option value="all">All Days</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>Day {day}</option>
          ))}
        </select>
      </div>

      <div className="space-y-5">
        {filteredWorkouts.map(workout => {
          const dayInfo = getDayInfo(workout.day);
          return (
            <div key={workout.id} className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all shadow-xl hover:shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${dayInfo?.color} text-white text-sm font-bold px-2 py-1 rounded`}>
                      Day {workout.day}
                    </span>
                    <span className="text-slate-300 font-semibold">
                      {dayInfo?.name}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{formatDate(workout.date)}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this workout?')) {
                      onDeleteWorkout(workout.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-bold hover:bg-red-500/20 px-4 py-2 rounded-lg transition-all uppercase tracking-wide"
                >
                  🗑️ Delete
                </button>
              </div>

              <div className="space-y-4">
                {workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-slate-600/40">
                    <h4 className="font-black text-slate-100 mb-3 text-lg uppercase tracking-wide">{exercise.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {exercise.sets && (
                        <div>
                          <span className="text-slate-400">Sets:</span>{' '}
                          <span className="text-slate-200">{exercise.sets}</span>
                        </div>
                      )}
                      {exercise.reps && (
                        <div>
                          <span className="text-slate-400">Reps:</span>{' '}
                          <span className="text-slate-200">{exercise.reps}</span>
                        </div>
                      )}
                      {exercise.weight && (
                        <div>
                          <span className="text-slate-400">Weight:</span>{' '}
                          <span className="text-slate-200">{exercise.weight} lbs</span>
                        </div>
                      )}
                      {exercise.rpe && (
                        <div>
                          <span className="text-slate-400">RPE:</span>{' '}
                          <span className="text-slate-200">{exercise.rpe}/10</span>
                        </div>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-slate-300 text-sm mt-2 italic">
                        "{exercise.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkouts.length === 0 && filterDay !== 'all' && (
        <p className="text-slate-400 text-center py-8">
          No workouts logged for Day {filterDay} yet.
        </p>
      )}
    </div>
  );
}
