import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDayInfo, DAY_CONFIG } from '../utils/dayConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function WorkoutDrawer({ isOpen, onClose, initialDay = null, initialDate = null, onSuccess, onOpenDrawer, currentDay = 1, getToken }) {
  const [selectedDay, setSelectedDay] = useState(initialDay || currentDay);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState('quick'); // 'quick' or 'detailed'
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [useNextWorkout, setUseNextWorkout] = useState(true);
  const [dropdownDay, setDropdownDay] = useState(() => {
    // Initialize dropdown to first alternative day
    const alternativeDays = Object.keys(DAY_CONFIG)
      .map(d => parseInt(d))
      .filter(d => d !== currentDay);
    return alternativeDays[0] || 1;
  });
  const dateInputRef = useRef(null);

  const dayInfo = getDayInfo(selectedDay);

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Default to currentDay (next workout) unless initialDay is explicitly provided
      if (initialDay) {
        setSelectedDay(initialDay);
        // If initialDay is not currentDay, set dropdown to that day and switch to "pick" mode
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
      // Use initialDate if provided, otherwise default to today
      setSelectedDate(initialDate || new Date().toISOString().split('T')[0]);
      setMode('quick');
      fetchExercises();
    }
  }, [isOpen, initialDay, initialDate, currentDay]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow value
      const originalOverflow = document.body.style.overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore original overflow when drawer closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Fetch exercises when day changes
  useEffect(() => {
    if (isOpen && selectedDay) {
      fetchExercises();
    }
  }, [selectedDay, isOpen]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/exercises/day/${selectedDay}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
        
        // Initialize completed exercises state
        setCompletedExercises(
          (data.exercises || []).map(ex => ({
            name: ex.name,
            completed: false,
            weight: ex.targetWeight || '',
            reps: ex.targetReps || '',
            sets: ex.targetSets || ''
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async () => {
    setLogging(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/log-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayNumber: selectedDay,
          dayName: dayInfo?.name || `Day ${selectedDay}`,
          mode: 'quick',
          date: selectedDate
        })
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Please try again.');
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
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/log-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayNumber: selectedDay,
          dayName: dayInfo?.name || `Day ${selectedDay}`,
          mode: 'detailed',
          exercises: completed,
          date: selectedDate
        })
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Please try again.');
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

  return (
    <>
      {/* Add Workout Button - Folder Tab style, seamlessly attached to drawer panel */}
      <motion.div
        initial={false}
        animate={{ 
          x: isOpen ? -672 : 0  // Move left by drawer width (max-w-2xl = 42rem = 672px)
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-[60]"
      >
        <button
          onClick={() => {
            if (isOpen) {
              onClose?.();
            } else {
              onOpenDrawer?.();
            }
          }}
          className="bg-slate-900/95 backdrop-blur-md hover:bg-slate-900 text-white px-6 py-4 border-l-2 border-t-2 border-cyan-500/30 hover:border-cyan-400/50 rounded-tl-xl font-bold uppercase tracking-wider shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-400/30 flex items-center gap-2 transition-all"
          title={isOpen ? "Close Workout Panel" : "Log New Workout"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Workout</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl z-50"
          >
            {/* Drawer Panel - starts below the tab button */}
            <div className="h-full bg-slate-900/95 backdrop-blur-md border-l-2 border-t-2 border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col pt-14">
              {/* Header - positioned under the tab */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-cyan-500/30 p-6 flex-shrink-0 -mt-14">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-4xl font-black text-cyan-400 uppercase tracking-wide mb-2">
                      Log Workout
                    </h2>
                    <p className="text-slate-400">Track your training session</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                    title="Close (Esc)"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
                      // Open the date picker when clicking anywhere in the input
                      try {
                        dateInputRef.current?.showPicker();
                      } catch (e) {
                        // showPicker() might not be supported in all browsers, silently fail
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer"
                  />
                </div>

                {/* Workout to Log - Flipper Toggle */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">
                    Workout to Log
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {/* Flipper Toggle Switch */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => {
                          if (useNextWorkout) {
                            // Flipping down - enable dropdown mode
                            setUseNextWorkout(false);
                            // Switch to the saved dropdown day
                            setSelectedDay(dropdownDay);
                          } else {
                            // Flipping up - return to "use next" mode
                            setSelectedDay(currentDay);
                            setUseNextWorkout(true);
                          }
                        }}
                        className="relative w-16 h-32 bg-slate-800 border-2 border-slate-600 rounded-full p-1 transition-all hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        {/* Toggle Indicator */}
                        <motion.div
                          animate={{
                            y: useNextWorkout ? 0 : '100%'
                          }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="absolute top-1 left-1 right-1 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/50"
                        />
                        
                        {/* Top Half - Active when useNextWorkout is true */}
                        <div className="absolute top-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 h-14">
                          <motion.div
                            animate={{
                              scale: useNextWorkout ? 1 : 0.7,
                              opacity: useNextWorkout ? 1 : 0.3
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`flex flex-col items-center transition-all ${
                              useNextWorkout ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            {/* Chevron Up Icon */}
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                            </svg>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              useNextWorkout ? 'text-white drop-shadow-lg' : 'text-slate-600'
                            }`}>
                              Next
                            </span>
                          </motion.div>
                        </div>
                        
                        {/* Bottom Half - Active when useNextWorkout is false */}
                        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 h-14">
                          <motion.div
                            animate={{
                              scale: !useNextWorkout ? 1 : 0.7,
                              opacity: !useNextWorkout ? 1 : 0.3
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`flex flex-col items-center transition-all ${
                              !useNextWorkout ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            {/* Chevron Down Icon */}
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              !useNextWorkout ? 'text-white drop-shadow-lg' : 'text-slate-600'
                            }`}>
                              Pick
                            </span>
                          </motion.div>
                        </div>
                      </button>
                      
                      <span className="text-xs text-slate-400 font-medium">
                        Flip
                      </span>
                    </div>

                    {/* Flipper Container with Two Boxes */}
                    <div className="flex-1 space-y-3">
                      {/* Top Box - Use Next (enabled when useNextWorkout is true) */}
                      <div
                        onClick={() => {
                          if (!useNextWorkout) {
                            // Clicking the "Use Next" box when it's disabled should enable it
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

                      {/* Bottom Box - Select Different Day (enabled when useNextWorkout is false) */}
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
                            // Update selectedDay only if we're in "pick" mode
                            if (!useNextWorkout) {
                              setSelectedDay(newDay);
                            }
                          }}
                          onClick={() => {
                            // If disabled appearance (useNextWorkout is true), toggle it and use the dropdown day
                            if (useNextWorkout) {
                              setUseNextWorkout(false);
                              setSelectedDay(dropdownDay);
                            }
                          }}
                          className={`w-full backdrop-blur-md rounded-xl px-4 py-4 font-bold text-white focus:outline-none focus:ring-2 transition-all bg-transparent cursor-pointer ${
                            !useNextWorkout
                              ? 'hover:border-cyan-400/70 focus:ring-cyan-500/50'
                              : ''
                          }`}
                        >
                          {/* All 12 Days except the current day (which is in the "Use Next" box) */}
                          {Object.entries(DAY_CONFIG)
                            .filter(([dayNum]) => parseInt(dayNum) !== currentDay)
                            .map(([dayNum, config]) => (
                              <option 
                                key={dayNum}
                                value={dayNum}
                                className="bg-slate-800 text-white font-bold"
                              >
                                {config.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
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

                  {/* Warning for Day 8 */}
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
                      Complete Day {selectedDay}
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Mark this workout as complete without detailed tracking
                    </p>
                    <button
                      onClick={handleQuickLog}
                      disabled={logging}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {logging ? '⏳ Logging...' : '✓ Complete Workout'}
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
                    ) : exercises.length === 0 ? (
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
                                    
                                    {/* Target Info */}
                                    {(exercises[idx]?.targetWeight || exercises[idx]?.targetReps || exercises[idx]?.targetSets) && (
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
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={handleDetailedLog}
                          disabled={logging || completedExercises.every(ex => !ex.completed)}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {logging ? '⏳ Saving...' : '💾 Save Workout'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
