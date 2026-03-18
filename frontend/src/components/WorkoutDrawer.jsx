// Log tab — single form for both creating new workouts and editing existing ones.
//
// When viewWorkout is null (create mode): form starts with defaults, submits via
// POST, no delete option. When viewWorkout is set (edit mode): form pre-fills
// with that workout's data, submits via PUT, delete button appears.
//
// The form looks and feels identical either way — you're always "editing a workout",
// it just happens to be new or existing. Backing out discards changes.

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getDayInfo, DAY_CONFIG } from '../utils/dayConfig';
import { apiFetch } from '../api/client.js';
import { todayLocal } from '../utils/dateUtils';
import { useDataSource } from '../api/snapshotContext.jsx';

export function LogTab({
  initialDay = null,
  initialDate = null,
  onSuccess,
  onViewWorkout,
  onWorkoutChanged,
  viewWorkout = null,
  currentDay = 1,
}) {
  const isEditMode = !!viewWorkout;

  // --- Form state (shared for create and edit) ---
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [mode, setMode] = useState('quick');
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useNextWorkout, setUseNextWorkout] = useState(true);
  const [dropdownDay, setDropdownDay] = useState(() => {
    const alternativeDays = Object.keys(DAY_CONFIG)
      .map(d => parseInt(d))
      .filter(d => d !== currentDay);
    return alternativeDays[0] || 1;
  });

  // --- Delete state (edit mode only) ---
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // --- Recent workouts ---
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  const dateInputRef = useRef(null);
  const { fetchWorkouts: fetchWorkoutsFromSource, isReady } = useDataSource();

  const dayInfo = getDayInfo(selectedDay);

  // ─────────────────────────────────────────────
  // Populate form from viewWorkout (edit) or defaults (create)
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (viewWorkout) {
      // Edit mode: populate from existing workout
      setSelectedDay(viewWorkout.dayNumber);
      setSelectedDate(viewWorkout.date);
      setMode(viewWorkout.mode || 'quick');
      setConfirmDelete(false);

      if (viewWorkout.dayNumber === currentDay) {
        setUseNextWorkout(true);
      } else {
        setUseNextWorkout(false);
        setDropdownDay(viewWorkout.dayNumber);
      }
    } else {
      // Create mode: populate from initialDay/initialDate or defaults
      if (initialDay) {
        setSelectedDay(initialDay);
        if (initialDay !== currentDay) {
          setDropdownDay(initialDay);
          setUseNextWorkout(false);
        } else {
          setUseNextWorkout(true);
        }
      } else {
        setSelectedDay(currentDay);
        setUseNextWorkout(true);
      }
      setSelectedDate(initialDate || todayLocal());
      setMode('quick');
      setConfirmDelete(false);
    }
  }, [viewWorkout, initialDay, initialDate, currentDay]);

  // Fetch exercise definitions when day changes, then overlay saved data if editing
  useEffect(() => {
    if (selectedDay) {
      fetchExercises();
    }
  }, [selectedDay, viewWorkout]);

  // Load recent workouts
  useEffect(() => {
    if (!isReady) return;
    fetchWorkoutsFromSource().then(data => {
      setRecentWorkouts((data.workouts || []).slice(0, 5));
    }).catch(() => {});
  }, [isReady]);

  // ─────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/exercises/day/${selectedDay}`);
      const defs = data.exercises || [];
      setExercises(defs);

      // Build the checklist — if editing, overlay saved exercise data
      const savedExercises = viewWorkout?.exercises || [];
      const savedByName = Object.fromEntries(
        savedExercises.map(ex => [ex.name, ex])
      );

      const checklist = defs.map(ex => {
        const saved = savedByName[ex.name];
        if (saved) {
          delete savedByName[ex.name];
          return {
            name: ex.name,
            completed: true,
            weight: saved.weight ?? ex.targetWeight ?? '',
            reps: saved.reps ?? ex.targetReps ?? '',
            sets: saved.sets ?? ex.targetSets ?? '',
          };
        }
        return {
          name: ex.name,
          completed: false,
          weight: ex.targetWeight || '',
          reps: ex.targetReps || '',
          sets: ex.targetSets || '',
        };
      });

      // Append any saved exercises that didn't match a definition
      for (const ex of Object.values(savedByName)) {
        checklist.push({
          name: ex.name,
          completed: true,
          weight: ex.weight ?? '',
          reps: ex.reps ?? '',
          sets: ex.sets ?? '',
        });
      }

      setCompletedExercises(checklist);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Submit (create or update)
  // ─────────────────────────────────────────────

  const handleSubmit = async () => {
    const completed = completedExercises.filter(ex => ex.completed);

    if (mode === 'detailed' && completed.length === 0) {
      alert('Please complete at least one exercise');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // PUT — update existing
        await apiFetch(`/api/logged-workouts/${viewWorkout.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            date: selectedDate,
            dayNumber: selectedDay,
            dayName: dayInfo?.name || `Day ${selectedDay}`,
            mode,
            exercises: mode === 'detailed' ? completed : [],
          })
        });
        onWorkoutChanged?.();
      } else {
        // POST — create new
        const result = await apiFetch('/api/log-workout', {
          method: 'POST',
          body: JSON.stringify({
            dayNumber: selectedDay,
            dayName: dayInfo?.name || `Day ${selectedDay}`,
            mode,
            date: selectedDate,
            ...(mode === 'detailed' ? { exercises: completed } : {}),
          })
        });
        onSuccess?.(result.advancedTo);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/logged-workouts/${viewWorkout.id}`, {
        method: 'DELETE'
      });
      onWorkoutChanged?.();
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout.');
    } finally {
      setDeleting(false);
    }
  };

  const updateExercise = (index, field, value) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const switchToCreateMode = () => {
    onViewWorkout?.(null);
  };

  // ─────────────────────────────────────────────
  // Render — one form, always
  // ─────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-4xl font-black text-cyan-400 uppercase tracking-wide mb-2">
          {isEditMode ? 'Edit Workout' : 'Log Workout'}
        </h2>
        {isEditMode ? (
          <button
            onClick={switchToCreateMode}
            className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ← Log New Workout
          </button>
        ) : (
          <p className="text-slate-400">Track your training session</p>
        )}
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
          Workout Date
        </label>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          onClick={() => {
            try { dateInputRef.current?.showPicker(); } catch {}
          }}
          max={todayLocal()}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer"
        />
      </div>

      {/* Workout to Log - Flipper Toggle */}
      <div>
        <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">
          Workout Day
        </label>

        <div className="flex items-center gap-4">
          {/* Flipper Toggle Switch */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (useNextWorkout) {
                  setUseNextWorkout(false);
                  setSelectedDay(dropdownDay);
                } else {
                  setSelectedDay(currentDay);
                  setUseNextWorkout(true);
                }
              }}
              className="relative w-16 h-32 bg-slate-800 border-2 border-slate-600 rounded-full p-1 transition-all hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <motion.div
                animate={{ y: useNextWorkout ? 0 : '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute top-1 left-1 right-1 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/50"
              />

              <div className="absolute top-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 h-14">
                <motion.div
                  animate={{ scale: useNextWorkout ? 1 : 0.7, opacity: useNextWorkout ? 1 : 0.3 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`flex flex-col items-center transition-all ${useNextWorkout ? 'text-white' : 'text-slate-600'}`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                  </svg>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${useNextWorkout ? 'text-white drop-shadow-lg' : 'text-slate-600'}`}>
                    Next
                  </span>
                </motion.div>
              </div>

              <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 h-14">
                <motion.div
                  animate={{ scale: !useNextWorkout ? 1 : 0.7, opacity: !useNextWorkout ? 1 : 0.3 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`flex flex-col items-center transition-all ${!useNextWorkout ? 'text-white' : 'text-slate-600'}`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${!useNextWorkout ? 'text-white drop-shadow-lg' : 'text-slate-600'}`}>
                    Pick
                  </span>
                </motion.div>
              </div>
            </button>

            <span className="text-xs text-slate-400 font-medium">Flip</span>
          </div>

          {/* Flipper Container with Two Boxes */}
          <div className="flex-1 space-y-3">
            <div
              onClick={() => {
                if (!useNextWorkout) {
                  setUseNextWorkout(true);
                  setSelectedDay(currentDay);
                }
              }}
              className={`relative rounded-xl px-4 py-4 font-bold text-white transition-all border-2 ${
                useNextWorkout
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-lg shadow-cyan-500/30 cursor-default'
                  : 'bg-slate-800/30 border-slate-600/50 text-slate-500 opacity-50 cursor-pointer hover:opacity-70 hover:border-slate-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wide">Use Next</span>
              </div>
              <div className="mt-2 text-lg font-black">
                {getDayInfo(currentDay)?.name || `Day ${currentDay}`}
              </div>
            </div>

            <div
              className={`relative rounded-xl transition-all border-2 ${
                !useNextWorkout
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50'
                  : 'bg-slate-800/20 border-slate-600/50 opacity-50'
              }`}
            >
              <select
                value={dropdownDay}
                onChange={(e) => {
                  const newDay = parseInt(e.target.value);
                  setDropdownDay(newDay);
                  if (!useNextWorkout) {
                    setSelectedDay(newDay);
                  }
                }}
                onClick={() => {
                  if (useNextWorkout) {
                    setUseNextWorkout(false);
                    setSelectedDay(dropdownDay);
                  }
                }}
                className={`w-full backdrop-blur-md rounded-xl px-4 py-4 font-bold text-white focus:outline-none focus:ring-2 transition-all bg-transparent cursor-pointer ${
                  !useNextWorkout ? 'hover:border-cyan-400/70 focus:ring-cyan-500/50' : ''
                }`}
              >
                {Object.entries(DAY_CONFIG)
                  .filter(([dayNum]) => parseInt(dayNum) !== currentDay)
                  .map(([dayNum, config]) => (
                    <option key={dayNum} value={dayNum} className="bg-slate-800 text-white font-bold">
                      {config.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Info */}
      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-2xl font-bold text-cyan-300 mb-1">
              {dayInfo?.name}
            </h3>
            <p className="text-slate-400">{dayInfo?.focus}</p>
          </div>
          <span className={`${dayInfo?.color} text-white text-sm font-bold px-3 py-1 rounded-full`}>
            Day {selectedDay}
          </span>
        </div>

        {dayInfo?.safetyNotes && (
          <div className="mt-4 bg-amber-900/30 border-2 border-amber-500/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-amber-200 text-sm font-medium">{dayInfo.safetyNotes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3 bg-slate-800/30 backdrop-blur-md rounded-xl p-2 mb-6">
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
        <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-slate-100 mb-3">
            {isEditMode ? `Day ${selectedDay}` : `Complete Day ${selectedDay}`}
          </h3>
          <p className="text-slate-400 mb-6">
            {isEditMode
              ? 'Save this workout without detailed exercise tracking'
              : 'Mark this workout as complete without detailed tracking'}
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? '⏳ Saving...'
              : isEditMode ? '💾 Save Changes' : '✓ Complete Workout'}
          </button>
        </div>
      )}

      {/* Detailed Mode */}
      {mode === 'detailed' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 animate-pulse">🏋️</div>
              <p className="text-slate-400">Loading exercises...</p>
            </div>
          ) : completedExercises.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
              <div className="text-5xl mb-3 opacity-50">📝</div>
              <p className="text-slate-400">No exercises defined for this day yet</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-bold text-slate-100 mb-4">
                  📋 Exercise Checklist
                </h3>
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

                          {exercises[idx] && (exercises[idx]?.targetWeight || exercises[idx]?.targetReps || exercises[idx]?.targetSets) && (
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
                          )}

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
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || completedExercises.every(ex => !ex.completed)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? '⏳ Saving...'
                  : isEditMode ? '💾 Save Changes' : '💾 Save Workout'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete (edit mode only) */}
      {isEditMode && (
        <div className="mt-4">
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all disabled:opacity-50"
              >
                {deleting ? '⏳ Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 px-6 py-3 rounded-xl font-bold uppercase tracking-wide border border-slate-700 hover:border-red-500/50 transition-all"
            >
              Delete Workout
            </button>
          )}
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-300 uppercase tracking-wide mb-4">
            Recent Workouts
          </h3>
          <div className="space-y-2">
            {recentWorkouts.map(workout => {
              const wDayInfo = getDayInfo(workout.dayNumber);
              const isActive = isEditMode && viewWorkout.id === workout.id;
              return (
                <div
                  key={workout.id}
                  onClick={() => onViewWorkout?.(workout)}
                  className={`bg-slate-800/30 rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.01] ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/5'
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                  title="View workout details"
                >
                  <div className="flex items-center gap-3">
                    <span className={`${wDayInfo?.color || 'bg-slate-600'} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                      Day {workout.dayNumber}
                    </span>
                    <span className="text-slate-300 font-bold text-sm">
                      {workout.dayName}
                    </span>
                    <span className="text-slate-500 text-xs ml-auto">
                      {new Date(workout.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-slate-600 text-xs">
                      {workout.mode === 'quick' ? '⚡' : '📋'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
