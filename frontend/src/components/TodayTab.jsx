import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAY_CONFIG } from '../utils/dayConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_ID = 'cf57d57d-1411-4f59-b517-e9a8600b140a';

export function TodayTab({ currentDay, onDayChange }) {
  const [mode, setMode] = useState('quick'); // 'quick' or 'detailed'
  const [workoutDay, setWorkoutDay] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Detailed mode state
  const [completedExercises, setCompletedExercises] = useState([]);
  
  // Override mode state
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [selectedDay, setSelectedDay] = useState(currentDay);

  // Fetch workout day info and exercises
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch workout day definition
        const dayResponse = await fetch(`${API_URL}/api/workout-days/${currentDay}`);
        if (dayResponse.ok) {
          const dayData = await dayResponse.json();
          setWorkoutDay(dayData.workoutDay);
        }

        // Fetch exercises for this day
        const exercisesResponse = await fetch(`${API_URL}/api/exercises/day/${currentDay}`);
        if (exercisesResponse.ok) {
          const exercisesData = await exercisesResponse.json();
          setExercises(exercisesData.exercises || []);
          
          // Initialize completed exercises state
          setCompletedExercises(
            exercisesData.exercises.map(ex => ({
              name: ex.name,
              completed: false,
              weight: ex.targetWeight || '',
              reps: ex.targetReps || '',
              sets: ex.targetSets || ''
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching workout data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentDay) {
      fetchData();
      setSuccess(false);
      setSelectedDay(currentDay);
    }
  }, [currentDay]);

  const handleQuickLog = async () => {
    setLogging(true);
    try {
      const response = await fetch(`${API_URL}/api/log-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
        body: JSON.stringify({
          dayNumber: currentDay,
          dayName: workoutDay?.name || `Day ${currentDay}`,
          mode: 'quick'
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error logging workout:', error);
    } finally {
      setLogging(false);
    }
  };

  const handleDetailedLog = async () => {
    const completed = completedExercises.filter(ex => ex.completed);
    
    if (completed.length === 0) {
      alert('Please complete at least one exercise');
      return;
    }

    setLogging(true);
    try {
      const response = await fetch(`${API_URL}/api/log-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
        body: JSON.stringify({
          dayNumber: currentDay,
          dayName: workoutDay?.name || `Day ${currentDay}`,
          mode: 'detailed',
          exercises: completed
        })
      });

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setCompletedExercises(
          exercises.map(ex => ({
            name: ex.name,
            completed: false,
            weight: ex.targetWeight || '',
            reps: ex.targetReps || '',
            sets: ex.targetSets || ''
          }))
        );
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error logging workout:', error);
    } finally {
      setLogging(false);
    }
  };

  const updateExercise = (index, field, value) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOverrideToggle = () => {
    setOverrideEnabled(!overrideEnabled);
  };

  const handleDaySelect = (e) => {
    const day = parseInt(e.target.value);
    setSelectedDay(day);
    onDayChange(day);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏋️</div>
          <p className="text-slate-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-cyan-400 uppercase tracking-wide">
          Today
        </h2>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-900/30 border-2 border-green-500/50 rounded-xl p-4 text-center"
          >
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-bold text-lg">Workout Logged Successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Day Card */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl border-2 border-cyan-500/50 p-8 shadow-2xl shadow-cyan-500/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-6xl font-black text-white mb-2">
              Day {currentDay}
            </div>
            <h3 className="text-3xl font-bold text-cyan-300 mb-2">
              {workoutDay?.name}
            </h3>
            <p className="text-slate-300 text-lg">
              {workoutDay?.focus}
            </p>
          </div>
          <div className="text-5xl">🏋️</div>
        </div>

        {/* Warning for Day 8 */}
        {workoutDay?.warning && (
          <div className="mt-4 bg-amber-900/30 border-2 border-amber-500/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="text-amber-400 font-bold">Important:</p>
                <p className="text-amber-200">{workoutDay.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Muscle Groups */}
        {workoutDay?.primaryMuscleGroups && (
          <div className="mt-4 flex flex-wrap gap-2">
            {workoutDay.primaryMuscleGroups.map((muscle, idx) => (
              <span
                key={idx}
                className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Override Controls */}
      <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
        <div className="space-y-4">
          <button
            onClick={handleOverrideToggle}
            className={`w-full py-3 px-6 rounded-lg font-bold uppercase tracking-wide transition-all ${
              overrideEnabled
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30'
                : 'bg-slate-700/60 hover:bg-slate-600/60 text-slate-300'
            }`}
          >
            {overrideEnabled ? '🔓 Override Active' : '🔒 Enable Day Override'}
          </button>
          
          <div className="relative">
            <select
              value={selectedDay}
              onChange={handleDaySelect}
              disabled={!overrideEnabled}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all appearance-none cursor-pointer ${
                overrideEnabled
                  ? 'bg-slate-700 border-2 border-cyan-500/50 text-slate-200 hover:border-cyan-400 focus:outline-none focus:border-cyan-400'
                  : 'bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed'
              }`}
              style={{ paddingRight: '2.5rem' }}
            >
              {Object.entries(DAY_CONFIG).map(([dayNum, dayInfo]) => (
                <option key={dayNum} value={dayNum}>
                  Day {dayNum}: {dayInfo.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg 
                className={`w-5 h-5 ${overrideEnabled ? 'text-cyan-400' : 'text-slate-600'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {overrideEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-center"
            >
              <p className="text-amber-300 text-sm font-medium">
                ⚠️ Manual day override is active
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3 bg-slate-800/30 backdrop-blur-md rounded-xl p-2">
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wide transition-all ${
            mode === 'quick'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ Quick Log
        </button>
        <button
          onClick={() => setMode('detailed')}
          className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wide transition-all ${
            mode === 'detailed'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 Detailed Log
        </button>
      </div>

      {/* Quick Mode */}
      {mode === 'quick' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 text-center"
        >
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-slate-100 mb-3">
            Complete Day {currentDay}
          </h3>
          <p className="text-slate-400 mb-6">
            Click to mark this workout as complete
          </p>
          <button
            onClick={handleQuickLog}
            disabled={logging}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logging ? '⏳ Logging...' : '✓ Complete Workout'}
          </button>
        </motion.div>
      )}

      {/* Detailed Mode */}
      {mode === 'detailed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">
              📋 Exercise Checklist
            </h3>
            <p className="text-slate-400 mb-6">
              Check off exercises as you complete them and log your actual weights/reps
            </p>

            {exercises.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No exercises defined for this day yet
              </div>
            ) : (
              <div className="space-y-3">
                {completedExercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-700/40 backdrop-blur-sm rounded-xl p-4 border transition-all ${
                      exercise.completed
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-slate-600/40'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={exercise.completed}
                        onChange={(e) => updateExercise(idx, 'completed', e.target.checked)}
                        className="mt-1 w-6 h-6 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-100 mb-2">{exercise.name}</h4>
                        
                        {/* Target Info */}
                        <div className="text-sm text-slate-400 mb-3">
                          {exercises[idx]?.targetWeight && (
                            <span>Target: {exercises[idx].targetWeight} lbs</span>
                          )}
                          {exercises[idx]?.targetReps && (
                            <span> × {exercises[idx].targetReps} reps</span>
                          )}
                          {exercises[idx]?.targetSets && (
                            <span> × {exercises[idx].targetSets} sets</span>
                          )}
                        </div>

                        {/* Input Fields */}
                        {exercise.completed && (
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Weight (lbs)"
                              value={exercise.weight}
                              onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                            <input
                              type="text"
                              placeholder="Reps"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                            <input
                              type="text"
                              placeholder="Sets"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleDetailedLog}
            disabled={logging || completedExercises.every(ex => !ex.completed)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logging ? '⏳ Saving...' : '💾 Save Workout'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
