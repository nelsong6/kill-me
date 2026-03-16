// Central state hook for workout data. Manages the user's current day in the
// 12-day cycle. Used by App.jsx to provide currentDay and setDay.
//
// The currentDay is persisted server-side as a `settings` document in Cosmos DB
// so it survives across devices and sessions. For anonymous visitors, it comes
// from the SQLite snapshot via useDataSource().

import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import { useDataSource } from '../api/snapshotContext.jsx';

export const useWorkouts = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const { fetchCurrentDay, isReady } = useDataSource();

  // Fetch current day from snapshot or API
  useEffect(() => {
    if (!isReady) return;
    const load = async () => {
      try {
        const data = await fetchCurrentDay();
        setCurrentDay(data.currentDay);
      } catch (err) {
        console.error('Failed to fetch current day:', err);
      }
    };
    load();
  }, [isReady]);

  // setDay always uses live API (admin-only write operation)
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

  return { currentDay, setDay, setCurrentDay };
};
