import { useState } from 'react';
import { getDayInfo } from '../utils/dayConfig';

export default function WorkoutForm({ currentDay, onAddWorkout }) {
  const [exercises, setExercises] = useState([{
    name: '',
    sets: '',
    reps: '',
    weight: '',
    restSeconds: '',
    notes: '',
    rpe: ''
  }]);

  const dayInfo = getDayInfo(currentDay);

  const handleAddExercise = () => {
    setExercises([...exercises, {
      name: '',
      sets: '',
      reps: '',
      weight: '',
      restSeconds: '',
      notes: '',
      rpe: ''
    }]);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty exercises and convert numeric fields
    const validExercises = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets ? parseInt(ex.sets) : null,
        reps: ex.reps ? parseInt(ex.reps) : null,
        weight: ex.weight ? parseFloat(ex.weight) : null,
        restSeconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
        notes: ex.notes.trim() || null,
        rpe: ex.rpe ? parseInt(ex.rpe) : null
      }));

    if (validExercises.length === 0) {
      alert('Please add at least one exercise with a name.');
      return;
    }

    onAddWorkout({ exercises: validExercises });
    
    // Reset form
    setExercises([{
      name: '',
      sets: '',
      reps: '',
      weight: '',
      restSeconds: '',
      notes: '',
      rpe: ''
    }]);
  };

  return (
    <div>
      <h2 className="text-4xl font-black text-slate-100 mb-8 flex items-center gap-4 uppercase tracking-wide">
        <span className="text-5xl">✏️</span>
        Log Workout
      </h2>
      
      <form onSubmit={handleSubmit}>
        {exercises.map((exercise, index) => (
          <div key={index} className="bg-slate-800/30 backdrop-blur-md rounded-2xl p-6 mb-5 border border-slate-700/50 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-200 uppercase tracking-wide">Exercise {index + 1}</h3>
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Exercise Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                  placeholder="e.g., Back Squat"
                  list={`exercises-day-${currentDay}`}
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <datalist id={`exercises-day-${currentDay}`}>
                  {dayInfo?.exercises.map((ex, i) => (
                    <option key={i} value={ex} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sets</label>
                <input
                  type="number"
                  min="0"
                  value={exercise.sets}
                  onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                  placeholder="4"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reps</label>
                <input
                  type="number"
                  min="0"
                  value={exercise.reps}
                  onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                  placeholder="8"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  min="0"
                  step="2.5"
                  value={exercise.weight}
                  onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                  placeholder="225"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rest (seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={exercise.restSeconds}
                  onChange={(e) => handleExerciseChange(index, 'restSeconds', e.target.value)}
                  placeholder="180"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RPE (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={exercise.rpe}
                  onChange={(e) => handleExerciseChange(index, 'rpe', e.target.value)}
                  placeholder="8"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  value={exercise.notes}
                  onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                  placeholder="Form cues, how it felt, etc."
                  rows="2"
                  className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleAddExercise}
            className="flex-1 bg-slate-800/50 hover:bg-slate-700/60 text-slate-200 py-4 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-105 border border-slate-700"
          >
            + Add Exercise
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-wider transition-all hover:scale-105 shadow-2xl shadow-blue-500/50 hover:shadow-blue-400/60"
          >
            💾 Save Workout
          </button>
        </div>
      </form>
    </div>
  );
}
