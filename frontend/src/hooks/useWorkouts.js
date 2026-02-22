import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_ID = 'cf57d57d-1411-4f59-b517-e9a8600b140a'; // Your Azure AD Object ID

export const useWorkouts = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current day from API
  useEffect(() => {
    const fetchCurrentDay = async () => {
      try {
        const response = await fetch(`${API_URL}/api/current-day`, {
          headers: {
            'X-User-ID': USER_ID
          }
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
          headers: {
            'X-User-ID': USER_ID
          }
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
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
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
        headers: {
          'X-User-ID': USER_ID
        }
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
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
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
