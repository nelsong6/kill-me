// Central state hook for workout data. Manages the user's current day in the
// 12-day cycle. Used by App.jsx to provide currentDay and setDay.
//
// The currentDay is persisted server-side as a `settings` document in Cosmos DB
// so it survives across devices and sessions.

import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';

export const useWorkouts = () => {
  const [currentDay, setCurrentDay] = useState(1);

  // Fetch current day from API (public endpoint)
  useEffect(() => {
    const fetchCurrentDay = async () => {
      try {
        const data = await apiFetch('/api/current-day');
        setCurrentDay(data.currentDay);
      } catch (err) {
        console.error('Failed to fetch current day:', err);
      }
    };
    fetchCurrentDay();
  }, []);

  const setDay = async (day) => {
    try {
      const data = await apiFetch('/api/current-day', {
        method: 'PUT',
        body: JSON.stringify({ currentDay: day })
      });
      setCurrentDay(data.currentDay);
    } catch (err) {
      console.error('Failed to update current day:', err);
      throw err;
    }
  };

  return { currentDay, setDay };
};
