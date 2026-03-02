import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useWorkouts = (getToken) => {
  const [currentDay, setCurrentDay] = useState(1);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authHeaders = async () => ({
    'Authorization': `Bearer ${await getToken()}`,
    'Content-Type': 'application/json',
  });

  // Fetch current day from API
  useEffect(() => {
    const fetchCurrentDay = async () => {
      try {
        const response = await fetch(`${API_URL}/api/current-day`, {
          headers: await authHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentDay(data.currentDay);
        }
      } catch (err) {
        console.error('Failed to fetch current day:', err);
      }
    };
    fetchCurrentDay();
  }, []);

  // Fetch workouts from API
  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/workouts`, {
          headers: await authHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setWorkouts(data.workouts || []);
      } catch (err) {
        console.error('Failed to fetch workouts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const addWorkout = async (workout) => {
    try {
      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(workout)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWorkouts(prev => [data.workout, ...prev]);
      return data.workout;
    } catch (err) {
      console.error('Failed to add workout:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteWorkout = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
      setError(err.message);
      throw err;
    }
  };

  const advanceDay = async () => {
    const nextDay = currentDay === 12 ? 1 : currentDay + 1;
    await setDay(nextDay);
  };

  const setDay = async (day) => {
    try {
      const response = await fetch(`${API_URL}/api/current-day`, {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ currentDay: day })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCurrentDay(data.currentDay);
    } catch (err) {
      console.error('Failed to update current day:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    currentDay,
    workouts,
    loading,
    error,
    addWorkout,
    deleteWorkout,
    advanceDay,
    setDay
  };
};
