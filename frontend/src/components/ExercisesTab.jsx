// Exercise library — browse, inspect, and manage exercises for each day.
//
// Shows all exercises for the selected day with full detail (equipment, notes,
// all variations with targets). Admin users can add new exercises via an inline
// form at the bottom.
//
// Other tabs (Workout, Log) link here by passing a dayNumber and optional
// exerciseName to scroll/highlight a specific exercise on mount.

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api/client.js';
import { useDataSource } from '../api/snapshotContext.jsx';
import { DAY_CONFIG } from '../utils/dayConfig.js';
import { colors } from '../colors.js';

function getDefaultVariation(exercise) {
  const vars = exercise.variations;
  if (!vars || !Array.isArray(vars) || vars.length === 0) {
    return {
      name: 'Standard',
      targetWeight: exercise.targetWeight,
      targetReps: exercise.targetReps,
      targetSets: exercise.targetSets,
    };
  }
  return vars.find(v => v.default) || vars[0];
}

const EMPTY_FORM = { name: '', equipment: '', notes: '', targetWeight: '', targetReps: '', targetSets: '' };

export function ExercisesTab({ currentDay, isAdmin, initialDay, initialExercise }) {
  const [selectedDay, setSelectedDay] = useState(initialDay || currentDay);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState(initialExercise || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const { fetchExercises, isReady } = useDataSource();
  const exerciseRefs = useRef({});

  // Update selectedDay when navigated to from another tab
  useEffect(() => {
    if (initialDay) setSelectedDay(initialDay);
  }, [initialDay]);

  useEffect(() => {
    if (initialExercise) setExpandedExercise(initialExercise);
  }, [initialExercise]);

  // Fetch exercises when day changes
  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchExercises(selectedDay);
        setExercises(data.exercises || []);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedDay, isReady]);

  // Scroll to highlighted exercise after load
  useEffect(() => {
    if (!loading && expandedExercise && exerciseRefs.current[expandedExercise]) {
      exerciseRefs.current[expandedExercise].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, expandedExercise]);

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) return;
    setAdding(true);
    try {
      const variations = [{
        name: 'Standard',
        default: true,
        targetWeight: newExercise.targetWeight ? Number(newExercise.targetWeight) : null,
        targetReps: newExercise.targetReps || null,
        targetSets: newExercise.targetSets ? Number(newExercise.targetSets) : null,
      }];
      await apiFetch('/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          dayNumber: selectedDay,
          name: newExercise.name.trim(),
          equipment: newExercise.equipment.trim(),
          notes: newExercise.notes.trim(),
          variations,
        }),
      });
      setNewExercise(EMPTY_FORM);
      setShowAddForm(false);
      // Refetch
      const data = await fetchExercises(selectedDay);
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Error adding exercise:', error);
    } finally {
      setAdding(false);
    }
  };

  const dayConfig = DAY_CONFIG[selectedDay];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-cyan-400 uppercase tracking-wide">
          Exercises
        </h2>
        <div className="text-slate-400 text-sm">
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Day selector strip */}
      <div style={styles.dayStrip}>
        {Object.entries(DAY_CONFIG).map(([dayNum, day]) => {
          const num = parseInt(dayNum);
          const selected = num === selectedDay;
          const isCurrent = num === currentDay;

          return (
            <button
              key={num}
              onClick={() => { setSelectedDay(num); setExpandedExercise(null); }}
              style={{
                ...styles.dayPill,
                ...(selected ? styles.dayPillSelected : {}),
                ...(isCurrent && !selected ? styles.dayPillCurrent : {}),
              }}
              title={day.name}
            >
              <span style={styles.dayPillNumber}>{num}</span>
              {isCurrent && (
                <span style={styles.todayDot} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day label */}
      {dayConfig && (
        <div className="text-slate-300">
          <span className="text-cyan-300 font-bold text-lg">Day {selectedDay}</span>
          <span className="text-slate-500 mx-2">&mdash;</span>
          <span>{dayConfig.name}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[20vh]">
          <p className="text-slate-400">Loading exercises...</p>
        </div>
      )}

      {/* Exercise list */}
      {!loading && (
        <div className="space-y-3">
          {exercises.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No exercises defined for Day {selectedDay} yet.
            </div>
          )}

          {exercises.map((exercise) => {
            const isExpanded = expandedExercise === exercise.name;
            const defaultVar = getDefaultVariation(exercise);
            const vars = exercise.variations || [];

            return (
              <div
                key={exercise.name}
                ref={el => { exerciseRefs.current[exercise.name] = el; }}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'bg-slate-800/50 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                    : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.name)}
                  className="w-full px-5 py-4 flex items-center justify-between cursor-pointer bg-transparent border-none text-left"
                >
                  <div>
                    <span className="font-semibold text-slate-100 text-base">{exercise.name}</span>
                    {exercise.equipment && (
                      <span className="text-slate-500 text-sm ml-2">({exercise.equipment})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-sm text-slate-400 flex gap-3">
                      {defaultVar.targetWeight && <span>{defaultVar.targetWeight} lbs</span>}
                      {defaultVar.targetReps && <span>{defaultVar.targetReps} reps</span>}
                      {defaultVar.targetSets && <span>{defaultVar.targetSets} sets</span>}
                    </div>
                    <span className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      &#9662;
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-700/30 pt-4">
                        {/* Notes */}
                        {exercise.notes && (
                          <p className="text-slate-400 text-sm">{exercise.notes}</p>
                        )}

                        {/* Location */}
                        {exercise.location && (
                          <div className="text-xs text-slate-500">
                            Location: <span className="text-slate-400">{exercise.location}</span>
                          </div>
                        )}

                        {/* Variations */}
                        {vars.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                              Variations
                            </h4>
                            <div className="space-y-2">
                              {vars.map((v, vi) => (
                                <div
                                  key={vi}
                                  className={`rounded-lg px-4 py-3 border ${
                                    v.default
                                      ? 'bg-cyan-500/10 border-cyan-500/30'
                                      : 'bg-slate-700/30 border-slate-600/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium text-sm ${v.default ? 'text-cyan-300' : 'text-slate-300'}`}>
                                        {v.name}
                                      </span>
                                      {v.default && (
                                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase font-bold">
                                          default
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-slate-400 flex gap-3">
                                      {v.targetWeight && <span>{v.targetWeight} lbs</span>}
                                      {v.targetReps && <span>{v.targetReps} reps</span>}
                                      {v.targetSets && <span>{v.targetSets} sets</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Add Exercise — admin only */}
          {isAdmin && (
            <div className="mt-4">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-600/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all font-semibold uppercase tracking-wide text-sm"
                >
                  + Add Exercise to Day {selectedDay}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                      New Exercise &mdash; Day {selectedDay}
                    </h3>
                    <button
                      onClick={() => { setShowAddForm(false); setNewExercise(EMPTY_FORM); }}
                      className="text-slate-400 hover:text-slate-200 text-xl leading-none cursor-pointer bg-transparent border-none"
                    >
                      &times;
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Exercise name *"
                    value={newExercise.name}
                    onChange={e => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Equipment (e.g. Smith Machine, Dumbbells)"
                    value={newExercise.equipment}
                    onChange={e => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={newExercise.notes}
                    onChange={e => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Weight (lbs)"
                      value={newExercise.targetWeight}
                      onChange={e => setNewExercise(prev => ({ ...prev, targetWeight: e.target.value }))}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Reps"
                      value={newExercise.targetReps}
                      onChange={e => setNewExercise(prev => ({ ...prev, targetReps: e.target.value }))}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Sets"
                      value={newExercise.targetSets}
                      onChange={e => setNewExercise(prev => ({ ...prev, targetSets: e.target.value }))}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={handleAddExercise}
                    disabled={adding || !newExercise.name.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'Adding...' : 'Add Exercise'}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  dayStrip: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayPill: {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: colors.bg.surface,
    color: colors.text.secondary,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.15s ease',
    padding: 0,
  },
  dayPillSelected: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderColor: colors.accent.cyan,
    color: colors.accent.cyan,
    boxShadow: `0 0 12px rgba(34, 211, 238, 0.2)`,
  },
  dayPillCurrent: {
    borderColor: 'rgba(90, 142, 112, 0.5)',
  },
  dayPillNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: colors.accent.green,
  },
};
