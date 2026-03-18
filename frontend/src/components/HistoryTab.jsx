// Workout history view with two modes: calendar and list.
//
// Calendar supports week/month/year views. Each day cell is color-coded by workout
// type using DAY_CONFIG colors (the color mapping is the main thing dayConfig.js
// is still needed for). Clicking a day opens the WorkoutDrawer pre-filled with
// that day's workout type and date.
//
// Filter bar lets you toggle visibility of specific workout types (days 1-12) —
// useful for seeing patterns like "how often do I do compound days?"
//
// Hover interaction: hovering a workout type in the legend or calendar dims all
// other types, making it easy to visually isolate one workout type across time.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DAY_CONFIG } from '../utils/dayConfig';
import { CARDIO_CONFIG } from '../utils/cardioConfig';
import { formatIntervalSummary } from '../utils/cardioTemplates';
import { useDataSource } from '../api/snapshotContext.jsx';
import { dateToLocal } from '../utils/dateUtils';

export function HistoryTab({ onDayClick, onWorkoutClick, onCardioClick }) {
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [calendarPeriod, setCalendarPeriod] = useState('month'); // 'week', 'month', or 'year'
  const [workouts, setWorkouts] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  // Filter state: tracks which workout types (days 1-12) and cardio types are enabled
  const [enabledWorkoutTypes, setEnabledWorkoutTypes] = useState({
    ...Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, true])),
    treadmill: true,
    bike: true,
  });
  // Hover state: tracks which workout type is currently being hovered
  const [hoveredWorkoutType, setHoveredWorkoutType] = useState(null);
  const { fetchWorkouts: fetchWorkoutsFromSource, fetchCardioSessions, isReady } = useDataSource();

  useEffect(() => {
    if (!isReady) return;
    loadData();
  }, [isReady]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workoutData, cardioData] = await Promise.all([
        fetchWorkoutsFromSource(),
        fetchCardioSessions(),
      ]);
      setWorkouts(workoutData.workouts || []);
      setCardioSessions(cardioData.sessions || []);
    } catch (error) {
      console.error('Error fetching history:', error);
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
    const dateString = dateToLocal(date);
    return workouts.filter(w =>
      w.date === dateString && enabledWorkoutTypes[w.dayNumber]
    );
  };

  const getCardioForDate = (date) => {
    const dateString = dateToLocal(date);
    return cardioSessions.filter(s =>
      s.date === dateString && enabledWorkoutTypes[s.activity]
    );
  };

  // Combined items for a date (workouts + cardio), each tagged with a kind
  const getItemsForDate = (date) => {
    const w = getWorkoutsForDate(date).map(item => ({ ...item, _kind: 'workout' }));
    const c = getCardioForDate(date).map(item => ({ ...item, _kind: 'cardio' }));
    return [...w, ...c];
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
    
    // Always allow navigating forward up to the current date
    if (endOfCurrentPeriod < new Date()) return true;

    const allItems = [...workouts, ...cardioSessions];
    return allItems.some(w => {
      const itemDate = new Date(w.date);
      return itemDate > endOfCurrentPeriod;
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

    const allItems = [...workouts, ...cardioSessions];
    return allItems.some(w => {
      const itemDate = new Date(w.date);
      return itemDate < startOfCurrentPeriod;
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

  // Get color for any calendar item (workout or cardio)
  const getItemColor = (item) => {
    if (item._kind === 'cardio') return null; // uses inline style
    return getDayColor(item.dayNumber);
  };

  const getItemColorStyle = (item) => {
    if (item._kind === 'cardio') {
      return { backgroundColor: CARDIO_CONFIG[item.activity]?.color || '#10b981' };
    }
    return {};
  };

  const getItemFilterKey = (item) => {
    if (item._kind === 'cardio') return item.activity;
    return item.dayNumber.toString();
  };

  const getItemTitle = (item) => {
    if (item._kind === 'cardio') {
      const cfg = CARDIO_CONFIG[item.activity];
      return `${cfg?.name || item.activity}${item.durationMinutes ? ` — ${item.durationMinutes} min` : ''}`;
    }
    return `Day ${item.dayNumber}: ${item.dayName}`;
  };

  const handleItemClick = (item) => {
    if (item._kind === 'cardio') {
      onCardioClick?.(item);
    } else {
      onWorkoutClick?.(item);
    }
  };

  const toggleWorkoutType = (dayNumber) => {
    setEnabledWorkoutTypes(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber]
    }));
  };

  const enableAllWorkoutTypes = () => {
    setEnabledWorkoutTypes({
      ...Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, true])),
      treadmill: true,
      bike: true,
    });
  };

  const disableAllWorkoutTypes = () => {
    setEnabledWorkoutTypes({
      ...Object.fromEntries(Object.keys(DAY_CONFIG).map(day => [day, false])),
      treadmill: false,
      bike: false,
    });
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl sm:text-5xl font-black text-cyan-400 uppercase tracking-wide">
          History
        </h2>

        {/* View Toggle */}
        <div className="flex gap-2 sm:gap-3 bg-slate-800/30 backdrop-blur-md rounded-xl p-1.5 sm:p-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold uppercase tracking-wide text-sm sm:text-base transition-all ${
              view === 'calendar'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">📅 </span>Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold uppercase tracking-wide text-sm sm:text-base transition-all ${
              view === 'list'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">📋 </span>List
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl border border-cyan-500/50 p-4 sm:p-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">{workouts.length}</div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Workouts</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">{cardioSessions.length}</div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Cardio</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">
              {new Set([...workouts.map(w => w.date), ...cardioSessions.map(s => s.date)]).size}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Days Active</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">
              {new Set(workouts.map(w => w.dayNumber)).size}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Cycle Days</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 p-3 sm:p-6"
        >
          {/* Period Toggle */}
          <div className="flex gap-1 sm:gap-2 bg-slate-700/30 backdrop-blur-md rounded-xl p-1.5 sm:p-2 mb-4 sm:mb-6">
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => changeMonth(-1)}
              disabled={!hasWorkoutsInPast()}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition-all ${
                hasWorkoutsInPast()
                  ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <span className="sm:hidden">←</span>
              <span className="hidden sm:inline">← Prev</span>
            </button>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-100">
              {calendarPeriod === 'year'
                ? selectedMonth.getFullYear()
                : selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              disabled={!hasWorkoutsInFuture()}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition-all ${
                hasWorkoutsInFuture()
                  ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <span className="sm:hidden">→</span>
              <span className="hidden sm:inline">Next →</span>
            </button>
          </div>

          {/* Week View */}
          {calendarPeriod === 'week' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center font-bold text-slate-400 text-xs sm:text-sm py-1 sm:py-2">
                    <span className="sm:hidden">{day}</span>
                    <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                  </div>
                ))}
              </div>

              {/* Week calendar grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {(() => {
                  const days = [];
                  const startOfWeek = new Date(selectedMonth);
                  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

                  for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    const dayItems = getItemsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();

                    days.push(
                      <div
                        key={i}
                        onClick={() => dayItems.length > 0
                          ? handleItemClick(dayItems[0])
                          : onDayClick?.(null, dateToLocal(date))
                        }
                        className={`min-h-[80px] sm:min-h-[120px] rounded-lg sm:rounded-xl border transition-all overflow-hidden cursor-pointer hover:scale-105 ${
                          isToday
                            ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                            : isCurrentMonth
                            ? 'border-slate-700 hover:border-slate-600'
                            : 'border-slate-800'
                        }`}
                      >
                        {dayItems.length > 0 ? (
                          <div className="h-full flex flex-col relative">
                            {dayItems.map((item, idx) => (
                              <div
                                key={idx}
                                className={`${getItemColor(item) || ''} flex-1 transition-opacity ${
                                  idx < dayItems.length - 1 ? 'border-b border-black/20' : ''
                                } ${hoveredWorkoutType && hoveredWorkoutType !== getItemFilterKey(item) ? 'opacity-30' : 'opacity-100'}`}
                                style={getItemColorStyle(item)}
                                title={getItemTitle(item)}
                                onMouseEnter={() => setHoveredWorkoutType(getItemFilterKey(item))}
                                onMouseLeave={() => setHoveredWorkoutType(null)}
                              />
                            ))}
                            {/* Day number overlay */}
                            <div className="absolute top-0.5 left-1 sm:top-1 sm:left-2 text-white font-black text-sm sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
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
                              <div className="text-lg sm:text-2xl font-black">
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
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-center font-bold text-slate-400 text-xs sm:text-sm py-1 sm:py-2">
                  <span className="sm:hidden">{day}</span>
                  <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                </div>
              ))}

              {/* Calendar days */}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
                const days = [];

                // Empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} className="h-14 sm:h-20" />);
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dayItems = getItemsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  days.push(
                    <div
                      key={day}
                      onClick={() => dayItems.length > 0
                        ? handleItemClick(dayItems[0])
                        : onDayClick?.(null, dateToLocal(date))
                      }
                      className={`h-14 sm:h-20 rounded-md sm:rounded-lg border transition-all overflow-hidden cursor-pointer hover:scale-105 ${
                        isToday
                          ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {dayItems.length > 0 ? (
                        <div className="h-full flex flex-col relative">
                          {dayItems.map((item, idx) => (
                            <div
                              key={idx}
                              className={`${getItemColor(item) || ''} flex-1 transition-opacity ${
                                idx < dayItems.length - 1 ? 'border-b border-black/20' : ''
                              } ${hoveredWorkoutType && hoveredWorkoutType !== getItemFilterKey(item) ? 'opacity-30' : 'opacity-100'}`}
                              style={getItemColorStyle(item)}
                              title={getItemTitle(item)}
                              onMouseEnter={() => setHoveredWorkoutType(getItemFilterKey(item))}
                              onMouseLeave={() => setHoveredWorkoutType(null)}
                            />
                          ))}
                          {/* Day number overlay */}
                          <div className="absolute top-0.5 left-1 sm:top-1 sm:left-2 text-white font-black text-xs sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
                            {day}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full relative ${
                          isToday ? 'bg-cyan-500/10' : 'bg-slate-800/20'
                        }`}>
                          <div className="absolute top-0.5 left-1 sm:top-1 sm:left-2 text-slate-200 font-black text-xs sm:text-lg">
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
                        const dayItems = getItemsForDate(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        // For year view color, pick the first item's color
                        const firstItem = dayItems[0];
                        const yearCellClass = firstItem
                          ? (firstItem._kind === 'cardio' ? '' : `${getDayColor(firstItem.dayNumber)} text-white hover:ring-white/50`)
                          : 'bg-slate-800/40 text-slate-500 hover:bg-slate-700/40';
                        const yearCellStyle = firstItem?._kind === 'cardio'
                          ? { backgroundColor: CARDIO_CONFIG[firstItem.activity]?.color || '#10b981', color: 'white' }
                          : {};

                        return (
                          <div
                            key={day}
                            onClick={(e) => {
                              e.stopPropagation();
                              dayItems.length > 0
                                ? handleItemClick(dayItems[0])
                                : onDayClick?.(null, dateToLocal(date));
                            }}
                            className={`aspect-square rounded-sm flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer hover:scale-110 hover:ring-1 hover:ring-white/30 ${
                              isToday
                                ? 'bg-cyan-500 text-white ring-1 ring-cyan-400'
                                : yearCellClass
                            }`}
                            style={!isToday ? yearCellStyle : {}}
                            title={
                              dayItems.length > 0
                                ? dayItems.map(getItemTitle).join(', ')
                                : 'Click to log'
                            }
                          >
                            {dayItems.length > 1 ? (
                              <span className="text-[7px]">●{dayItems.length}</span>
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
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
              {Object.entries(DAY_CONFIG).map(([dayNum, config]) => {
                const isEnabled = enabledWorkoutTypes[dayNum];
                const isDimmed = hoveredWorkoutType && hoveredWorkoutType !== dayNum;
                return (
                  <button
                    key={dayNum}
                    onClick={() => toggleWorkoutType(dayNum)}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
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

              {/* Cardio filters */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-4 mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-1.5">Cardio</p>
              </div>
              {Object.entries(CARDIO_CONFIG).map(([key, config]) => {
                const isEnabled = enabledWorkoutTypes[key];
                const isDimmed = hoveredWorkoutType && hoveredWorkoutType !== key;
                return (
                  <button
                    key={key}
                    onClick={() => toggleWorkoutType(key)}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                      isEnabled
                        ? 'border-slate-600 bg-slate-700/40 hover:bg-slate-700/60'
                        : 'border-slate-800 bg-slate-900/40 opacity-40 hover:opacity-60'
                    } ${isDimmed ? 'opacity-30' : ''}`}
                    title={`Click to ${isEnabled ? 'hide' : 'show'} ${config.name}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 transition-all"
                      style={{ backgroundColor: config.color, filter: isEnabled ? 'none' : 'grayscale(1)' }}
                    />
                    <div className="text-left flex-1">
                      <div className={`font-bold ${isEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                        {config.name}
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
          {(() => {
            // Merge workouts and cardio, sort by date descending
            const allItems = [
              ...workouts.filter(w => enabledWorkoutTypes[w.dayNumber]).map(w => ({ ...w, _kind: 'workout' })),
              ...cardioSessions.filter(s => enabledWorkoutTypes[s.activity]).map(s => ({ ...s, _kind: 'cardio' })),
            ].sort((a, b) => b.date.localeCompare(a.date));

            if (allItems.length === 0) {
              return (
                <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-dashed border-slate-700">
                  <div className="text-8xl mb-6 opacity-50">🏋️</div>
                  <p className="text-slate-300 text-2xl font-bold mb-3">No Activity Yet</p>
                  <p className="text-slate-500 text-lg">Start your journey by logging your first session</p>
                </div>
              );
            }

            return allItems.map(item => {
              if (item._kind === 'cardio') {
                const config = CARDIO_CONFIG[item.activity] || CARDIO_CONFIG.treadmill;
                return (
                  <div
                    key={item.id}
                    onClick={() => onCardioClick?.(item)}
                    className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02]"
                    title="View cardio session"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="text-white text-sm font-bold px-3 py-1 rounded-full"
                            style={{ backgroundColor: config.color }}
                          >
                            {config.name}
                          </span>
                          {item.durationMinutes && (
                            <span className="text-slate-300 font-bold text-lg">
                              {item.durationMinutes} min
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{formatDate(item.date)}</p>
                      </div>
                    </div>

                    {/* Treadmill interval summary */}
                    {item.treadmill?.intervals && (
                      <div className="mt-2 text-sm text-slate-400">
                        {formatIntervalSummary(item.treadmill.intervals)}
                        {item.treadmill.templateName && (
                          <span className="ml-2 text-slate-500">({item.treadmill.templateName})</span>
                        )}
                      </div>
                    )}

                    {/* Bike metrics */}
                    {item.bike && (
                      <div className="mt-2 flex gap-4 text-sm text-slate-400">
                        {item.bike.distanceMiles && <span>{item.bike.distanceMiles} mi</span>}
                        {item.bike.avgSpeedMph && <span>{item.bike.avgSpeedMph} mph avg</span>}
                        {item.bike.avgHeartRate && <span>{item.bike.avgHeartRate} bpm</span>}
                        {item.bike.calories && <span>{item.bike.calories} cal</span>}
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-500 italic">{item.notes}</p>
                    )}
                  </div>
                );
              }

              // Weight workout card (existing)
              return (
                <div
                  key={item.id}
                  onClick={() => onWorkoutClick?.(item)}
                  className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02]"
                  title="View workout details"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`${getDayColor(item.dayNumber)} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                          Day {item.dayNumber}
                        </span>
                        <span className="text-slate-300 font-bold text-lg">
                          {item.dayName}
                        </span>
                        {item.mode && (
                          <span className="text-slate-500 text-sm">
                            {item.mode === 'quick' ? '⚡' : '📋'} {item.mode}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{formatDate(item.date)}</p>
                    </div>
                  </div>

                  {item.exercises && item.exercises.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {item.exercises.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-700/40 backdrop-blur-sm rounded-lg p-3 text-sm"
                        >
                          <div className="font-bold text-slate-100 mb-1">
                            {exercise.name}
                            {exercise.variation && exercise.variation !== 'Standard' && (
                              <span className="text-cyan-400 font-normal ml-1">({exercise.variation})</span>
                            )}
                          </div>
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
              );
            });
          })()}
        </motion.div>
      )}
    </div>
  );
}
