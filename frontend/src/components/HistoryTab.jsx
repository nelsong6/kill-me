import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DAY_CONFIG } from '../utils/dayConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_ID = 'cf57d57d-1411-4f59-b517-e9a8600b140a';

export function HistoryTab({ onDayClick }) {
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [calendarPeriod, setCalendarPeriod] = useState('month'); // 'week', 'month', or 'year'
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  // Filter state: tracks which workout types (days 1-12) are enabled
  const [enabledWorkoutTypes, setEnabledWorkoutTypes] = useState(
    Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, true]))
  );
  // Hover state: tracks which workout type is currently being hovered
  const [hoveredWorkoutType, setHoveredWorkoutType] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/logged-workouts`, {
        headers: {
          'X-User-ID': USER_ID
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkouts(data.workouts || []);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWorkoutsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return workouts.filter(w => 
      w.date === dateString && enabledWorkoutTypes[w.dayNumber]
    );
  };

  const changeMonth = (direction) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (calendarPeriod === 'year') {
        newDate.setFullYear(newDate.getFullYear() + direction);
      } else if (calendarPeriod === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
      } else {
        newDate.setMonth(newDate.getMonth() + direction);
      }
      return newDate;
    });
  };

  const goToCurrentTime = () => {
    setSelectedMonth(new Date());
  };

  // Check if there are any workouts in the future or past
  const hasWorkoutsInFuture = () => {
    const endOfCurrentPeriod = new Date(selectedMonth);
    if (calendarPeriod === 'week') {
      endOfCurrentPeriod.setDate(endOfCurrentPeriod.getDate() + 6);
    } else if (calendarPeriod === 'month') {
      endOfCurrentPeriod.setMonth(endOfCurrentPeriod.getMonth() + 1);
      endOfCurrentPeriod.setDate(0); // Last day of current month
    } else if (calendarPeriod === 'year') {
      endOfCurrentPeriod.setFullYear(endOfCurrentPeriod.getFullYear() + 1);
      endOfCurrentPeriod.setDate(0); // Last day of year
    }
    
    return workouts.some(w => {
      const workoutDate = new Date(w.date);
      return workoutDate > endOfCurrentPeriod;
    });
  };

  const hasWorkoutsInPast = () => {
    const startOfCurrentPeriod = new Date(selectedMonth);
    if (calendarPeriod === 'week') {
      startOfCurrentPeriod.setDate(startOfCurrentPeriod.getDate() - startOfCurrentPeriod.getDay());
    } else if (calendarPeriod === 'month') {
      startOfCurrentPeriod.setDate(1);
    } else if (calendarPeriod === 'year') {
      startOfCurrentPeriod.setMonth(0);
      startOfCurrentPeriod.setDate(1);
    }
    
    return workouts.some(w => {
      const workoutDate = new Date(w.date);
      return workoutDate < startOfCurrentPeriod;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayColor = (dayNumber) => {
    return DAY_CONFIG[dayNumber]?.color || 'bg-slate-500';
  };

  const toggleWorkoutType = (dayNumber) => {
    setEnabledWorkoutTypes(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber]
    }));
  };

  const enableAllWorkoutTypes = () => {
    setEnabledWorkoutTypes(
      Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, true]))
    );
  };

  const disableAllWorkoutTypes = () => {
    setEnabledWorkoutTypes(
      Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, false]))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <p className="text-slate-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-cyan-400 uppercase tracking-wide">
          History
        </h2>
        
        {/* View Toggle */}
        <div className="flex gap-3 bg-slate-800/30 backdrop-blur-md rounded-xl p-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wide transition-all ${
              view === 'calendar'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wide transition-all ${
              view === 'list'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl border border-cyan-500/50 p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-4xl font-black text-white">{workouts.length}</div>
            <div className="text-slate-300 text-sm uppercase tracking-wide">Total Workouts</div>
          </div>
          <div>
            <div className="text-4xl font-black text-white">
              {new Set(workouts.map(w => w.date)).size}
            </div>
            <div className="text-slate-300 text-sm uppercase tracking-wide">Days Logged</div>
          </div>
          <div>
            <div className="text-4xl font-black text-white">
              {new Set(workouts.map(w => w.dayNumber)).size}
            </div>
            <div className="text-slate-300 text-sm uppercase tracking-wide">Different Days</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6"
        >
          {/* Period Toggle */}
          <div className="flex gap-2 bg-slate-700/30 backdrop-blur-md rounded-xl p-2 mb-6">
            <button
              onClick={() => {
                goToCurrentTime();
                setCalendarPeriod('week');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-bold uppercase text-sm tracking-wide transition-all ${
                calendarPeriod === 'week'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => {
                goToCurrentTime();
                setCalendarPeriod('month');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-bold uppercase text-sm tracking-wide transition-all ${
                calendarPeriod === 'month'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => {
                goToCurrentTime();
                setCalendarPeriod('year');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-bold uppercase text-sm tracking-wide transition-all ${
                calendarPeriod === 'year'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Year
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              disabled={!hasWorkoutsInPast()}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                hasWorkoutsInPast()
                  ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              ← Prev
            </button>
            <h3 className="text-2xl font-bold text-slate-100">
              {calendarPeriod === 'year' 
                ? selectedMonth.getFullYear()
                : selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              disabled={!hasWorkoutsInFuture()}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                hasWorkoutsInFuture()
                  ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              Next →
            </button>
          </div>

          {/* Week View */}
          {calendarPeriod === 'week' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-slate-400 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Week calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const days = [];
                  const startOfWeek = new Date(selectedMonth);
                  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

                  for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    const dayWorkouts = getWorkoutsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();

                    days.push(
                      <div
                        key={i}
                        onClick={() => onDayClick?.(dayWorkouts.length > 0 ? dayWorkouts[0].dayNumber : null, date.toISOString().split('T')[0])}
                        className={`min-h-[120px] rounded-xl border transition-all overflow-hidden cursor-pointer hover:scale-105 ${
                          isToday
                            ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                            : isCurrentMonth
                            ? 'border-slate-700 hover:border-slate-600'
                            : 'border-slate-800'
                        }`}
                      >
                        {dayWorkouts.length > 0 ? (
                          <div className="h-full flex flex-col relative">
                            {dayWorkouts.map((workout, idx) => (
                              <div
                                key={idx}
                                className={`${getDayColor(workout.dayNumber)} flex-1 transition-opacity ${
                                  idx < dayWorkouts.length - 1 ? 'border-b border-black/20' : ''
                                } ${hoveredWorkoutType && hoveredWorkoutType !== workout.dayNumber.toString() ? 'opacity-30' : 'opacity-100'}`}
                                title={`Day ${workout.dayNumber}: ${workout.dayName} - Click to log this day`}
                                onMouseEnter={() => setHoveredWorkoutType(workout.dayNumber.toString())}
                                onMouseLeave={() => setHoveredWorkoutType(null)}
                              />
                            ))}
                            {/* Day number overlay */}
                            <div className="absolute top-1 left-2 text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
                              {date.getDate()}
                            </div>
                          </div>
                        ) : (
                          <div className={`h-full p-3 ${
                            isToday
                              ? 'bg-cyan-500/10'
                              : isCurrentMonth
                              ? 'bg-slate-800/20'
                              : 'bg-slate-900/20'
                          }`}>
                            <div className={`text-center ${isCurrentMonth ? 'text-slate-200' : 'text-slate-600'}`}>
                              <div className="text-2xl font-black">
                                {date.getDate()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          )}

          {/* Month View */}
          {calendarPeriod === 'month' && (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-slate-400 text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
                const days = [];

                // Empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} className="aspect-square" />);
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dayWorkouts = getWorkoutsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  days.push(
                    <div
                      key={day}
                      onClick={() => onDayClick?.(dayWorkouts.length > 0 ? dayWorkouts[0].dayNumber : null, date.toISOString().split('T')[0])}
                      className={`aspect-square rounded-lg border transition-all overflow-hidden cursor-pointer hover:scale-105 ${
                        isToday
                          ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {dayWorkouts.length > 0 ? (
                        <div className="h-full flex flex-col relative">
                          {dayWorkouts.map((workout, idx) => (
                            <div
                              key={idx}
                              className={`${getDayColor(workout.dayNumber)} flex-1 transition-opacity ${
                                idx < dayWorkouts.length - 1 ? 'border-b border-black/20' : ''
                              } ${hoveredWorkoutType && hoveredWorkoutType !== workout.dayNumber.toString() ? 'opacity-30' : 'opacity-100'}`}
                              title={`Day ${workout.dayNumber}: ${workout.dayName} - Click to log this day`}
                              onMouseEnter={() => setHoveredWorkoutType(workout.dayNumber.toString())}
                              onMouseLeave={() => setHoveredWorkoutType(null)}
                            />
                          ))}
                          {/* Day number overlay */}
                          <div className="absolute top-1 left-2 text-white font-black text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
                            {day}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full relative ${
                          isToday ? 'bg-cyan-500/10' : 'bg-slate-800/20'
                        }`}>
                          {/* Day number - same style as workout days */}
                          <div className="absolute top-1 left-2 text-slate-200 font-black text-lg">
                            {day}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return days;
              })()}
            </div>
          )}

          {/* Year View */}
          {calendarPeriod === 'year' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(selectedMonth.getFullYear(), monthIndex, 1);
                const { daysInMonth, startingDayOfWeek } = getDaysInMonth(monthDate);

                return (
                  <div
                    key={monthIndex}
                    className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 border border-slate-600/40 hover:border-slate-500 transition-all"
                  >
                    {/* Month name */}
                    <div 
                      className="text-center text-slate-200 font-bold text-sm mb-2 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => {
                        setSelectedMonth(monthDate);
                        setCalendarPeriod('month');
                      }}
                      title="Click to view this month"
                    >
                      {monthDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>

                    {/* Mini calendar */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day headers */}
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={idx} className="text-center text-[8px] text-slate-500 font-bold">
                          {day}
                        </div>
                      ))}

                      {/* Empty cells before month starts */}
                      {Array.from({ length: startingDayOfWeek }, (_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}

                      {/* Days of the month */}
                      {Array.from({ length: daysInMonth }, (_, day) => {
                        const date = new Date(selectedMonth.getFullYear(), monthIndex, day + 1);
                        const dayWorkouts = getWorkoutsForDate(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={day}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent month card click
                              onDayClick?.(dayWorkouts.length > 0 ? dayWorkouts[0].dayNumber : null, date.toISOString().split('T')[0]);
                            }}
                            className={`aspect-square rounded-sm flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer hover:scale-110 hover:ring-1 hover:ring-white/30 ${
                              isToday
                                ? 'bg-cyan-500 text-white ring-1 ring-cyan-400'
                                : dayWorkouts.length > 0
                                ? `${getDayColor(dayWorkouts[0].dayNumber)} text-white hover:ring-white/50`
                                : 'bg-slate-800/40 text-slate-500 hover:bg-slate-700/40'
                            }`}
                            title={
                              dayWorkouts.length > 0
                                ? dayWorkouts.map(w => `Day ${w.dayNumber}: ${w.dayName}`).join(', ') + ' - Click to log workout'
                                : 'Click to log workout'
                            }
                          >
                            {dayWorkouts.length > 1 ? (
                              <span className="text-[7px]">●{dayWorkouts.length}</span>
                            ) : (
                              day + 1
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend with Filters */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-200 text-sm font-bold uppercase tracking-wide">
                Filter by Workout Type:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={enableAllWorkoutTypes}
                  className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/50 hover:border-green-400/70 text-green-400 hover:text-green-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
                >
                  ✓ Enable All
                </button>
                <button
                  onClick={disableAllWorkoutTypes}
                  className="bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 border border-red-500/50 hover:border-red-400/70 text-red-400 hover:text-red-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
                >
                  ✕ Disable All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {Object.entries(DAY_CONFIG).map(([dayNum, config]) => {
                const isEnabled = enabledWorkoutTypes[dayNum];
                const isDimmed = hoveredWorkoutType && hoveredWorkoutType !== dayNum;
                return (
                  <button
                    key={dayNum}
                    onClick={() => toggleWorkoutType(dayNum)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isEnabled
                        ? 'border-slate-600 bg-slate-700/40 hover:bg-slate-700/60'
                        : 'border-slate-800 bg-slate-900/40 opacity-40 hover:opacity-60'
                    } ${isDimmed ? 'opacity-30' : ''}`}
                    title={`Click to ${isEnabled ? 'hide' : 'show'} ${config.name}`}
                  >
                    <div className={`w-4 h-4 rounded-full ${config.color} flex-shrink-0 transition-all ${
                      isEnabled ? 'shadow-lg' : 'grayscale'
                    }`} />
                    <div className="text-left flex-1">
                      <div className={`font-bold ${isEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                        {config.name}
                      </div>
                      <div className={`text-[10px] ${isEnabled ? 'text-slate-400' : 'text-slate-700'}`}>
                        Day {dayNum}
                      </div>
                    </div>
                    <div className={`text-lg ${isEnabled ? 'text-green-400' : 'text-slate-700'}`}>
                      {isEnabled ? '✓' : '○'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {workouts.length === 0 ? (
            <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-dashed border-slate-700">
              <div className="text-8xl mb-6 opacity-50">🏋️</div>
              <p className="text-slate-300 text-2xl font-bold mb-3">No Workouts Yet</p>
              <p className="text-slate-500 text-lg">Start your journey by logging your first session</p>
            </div>
          ) : (
            workouts.map(workout => (
              <div
                key={workout.id}
                onClick={() => onDayClick?.(workout.dayNumber, workout.date)}
                className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02]"
                title="Click to log this workout day"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`${getDayColor(workout.dayNumber)} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                        Day {workout.dayNumber}
                      </span>
                      <span className="text-slate-300 font-bold text-lg">
                        {workout.dayName}
                      </span>
                      {workout.mode && (
                        <span className="text-slate-500 text-sm">
                          {workout.mode === 'quick' ? '⚡' : '📋'} {workout.mode}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{formatDate(workout.date)}</p>
                  </div>
                </div>

                {/* Exercises (if detailed mode) */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {workout.exercises.map((exercise, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-700/40 backdrop-blur-sm rounded-lg p-3 text-sm"
                      >
                        <div className="font-bold text-slate-100 mb-1">{exercise.name}</div>
                        <div className="text-slate-400">
                          {exercise.weight && <span>{exercise.weight} lbs</span>}
                          {exercise.reps && <span> × {exercise.reps} reps</span>}
                          {exercise.sets && <span> × {exercise.sets} sets</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
