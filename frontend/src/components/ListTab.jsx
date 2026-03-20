// Chronological list view of all logged workouts and cardio sessions.
// Extracted from HistoryTab to be its own sidebar tab.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DAY_CONFIG } from '../utils/dayConfig';
import { CARDIO_CONFIG } from '../utils/cardioConfig';
import { formatIntervalSummary } from '../utils/cardioTemplates';
import { useDataSource } from '../api/snapshotContext.jsx';
import { formatTime12h } from '../utils/dateUtils';
import { colors } from '../colors';

const SORENESS_COLOR = '#f97316'; // orange-500

export function ListTab({ onWorkoutClick, onCardioClick }) {
  const [workouts, setWorkouts] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [sorenessEntries, setSorenessEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchWorkouts: fetchWorkoutsFromSource, fetchCardioSessions, fetchSoreness, isReady } = useDataSource();

  useEffect(() => {
    if (!isReady) return;
    loadData();
  }, [isReady]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workoutData, cardioData, sorenessData] = await Promise.all([
        fetchWorkoutsFromSource(),
        fetchCardioSessions(),
        fetchSoreness(),
      ]);
      setWorkouts(workoutData.workouts || []);
      setCardioSessions(cardioData.sessions || []);
      setSorenessEntries(sorenessData.entries || []);
    } catch (error) {
      console.error('Error fetching list data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📋</div>
          <p className="text-slate-400">Loading list...</p>
        </div>
      </div>
    );
  }

  // Helper: format soreness level
  const getLevelLabel = (level) => {
    if (level <= 2) return 'Mild';
    if (level <= 4) return 'Noticeable';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Significant';
    return 'Severe';
  };

  const getLevelColor = (level) => {
    if (level <= 2) return colors.accent.green;
    if (level <= 4) return colors.accent.cyan;
    if (level <= 6) return colors.accent.gold;
    if (level <= 8) return colors.accent.amber;
    return colors.accent.red;
  };

  // Merge workouts, cardio, and soreness — sort by date descending
  const allItems = [
    ...workouts.map(w => ({ ...w, _kind: 'workout' })),
    ...cardioSessions.map(s => ({ ...s, _kind: 'cardio' })),
    ...sorenessEntries.map(e => ({ ...e, _kind: 'soreness' })),
  ].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    // Same date: sort by time descending (items without time go last)
    const at = a.time || '';
    const bt = b.time || '';
    return bt.localeCompare(at);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <h2 className="text-3xl sm:text-5xl font-black text-cyan-400 uppercase tracking-wide">
        List
      </h2>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl border border-cyan-500/50 p-4 sm:p-6">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">{workouts.length}</div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Workouts</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">{cardioSessions.length}</div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Cardio</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">{sorenessEntries.length}</div>
            <div className="text-slate-300 text-[10px] sm:text-sm uppercase tracking-wide">Soreness</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white">
              {new Set([...workouts.map(w => w.date), ...cardioSessions.map(s => s.date), ...sorenessEntries.map(e => e.date)]).size}
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

      {/* List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {allItems.length === 0 ? (
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-dashed border-slate-700">
            <div className="text-8xl mb-6 opacity-50">🏋️</div>
            <p className="text-slate-300 text-2xl font-bold mb-3">No Activity Yet</p>
            <p className="text-slate-500 text-lg">Start your journey by logging your first session</p>
          </div>
        ) : (
          allItems.map(item => {
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
                      <p className="text-slate-400 text-sm">
                        {formatDate(item.date)}
                        {item.time && <span className="ml-2 text-slate-500">{formatTime12h(item.time)}</span>}
                      </p>
                    </div>
                  </div>

                  {item.treadmill?.intervals && (
                    <div className="mt-2 text-sm text-slate-400">
                      {formatIntervalSummary(item.treadmill.intervals)}
                      {item.treadmill.templateName && (
                        <span className="ml-2 text-slate-500">({item.treadmill.templateName})</span>
                      )}
                    </div>
                  )}

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

            if (item._kind === 'soreness') {
              return (
                <div
                  key={`soreness-${item.date}`}
                  className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-white text-sm font-bold px-3 py-1 rounded-full"
                          style={{ backgroundColor: SORENESS_COLOR }}
                        >
                          Soreness
                        </span>
                        <span className="text-slate-300 font-bold text-lg">
                          {item.muscles.length} muscle{item.muscles.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.muscles.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg bg-slate-700/40"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getLevelColor(m.level) }}
                        />
                        <span className="text-slate-200 font-medium">
                          {m.muscle || m.group}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {m.level}/10 {getLevelLabel(m.level)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

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
                    <p className="text-slate-400 text-sm">
                        {formatDate(item.date)}
                        {item.time && <span className="ml-2 text-slate-500">{formatTime12h(item.time)}</span>}
                      </p>
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
          })
        )}
      </motion.div>
    </div>
  );
}
