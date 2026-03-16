// Snapshot data layer — loads a SQLite snapshot for anonymous visitors.
//
// When no auth token is present, fetches /snapshot.db and opens it with sql.js
// (SQLite compiled to WASM). Provides a useDataSource() hook that routes reads
// to either the local snapshot or the live API depending on auth state.
//
// If the snapshot is missing (404) or fails to load, falls back to live API
// calls for all users.

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiFetch } from './client.js';
import {
  getCurrentDay,
  getWorkoutDay,
  getExercisesForDay,
  getLoggedWorkouts,
  getSorenessEntries,
} from './snapshot.js';

const SnapshotContext = createContext(null);

// Load sql.js WASM and open the snapshot database
async function loadSnapshot() {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });

  const response = await fetch('/snapshot.db');
  if (!response.ok) return null;

  const buffer = await response.arrayBuffer();
  return new SQL.Database(new Uint8Array(buffer));
}

export function SnapshotProvider({ children }) {
  const { token } = useAuth();
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(!token);
  const loadAttempted = useRef(false);

  useEffect(() => {
    // Skip snapshot loading if user is authenticated or already attempted
    if (token || loadAttempted.current) {
      setLoading(false);
      return;
    }
    loadAttempted.current = true;

    loadSnapshot()
      .then((database) => setDb(database))
      .catch((err) => console.warn('Snapshot load failed, using live API:', err))
      .finally(() => setLoading(false));
  }, [token]);

  // Clean up the database when the user authenticates (switch to live API)
  useEffect(() => {
    if (token && db) {
      db.close();
      setDb(null);
    }
  }, [token]);

  return (
    <SnapshotContext.Provider value={{ db, loading }}>
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshot() {
  const ctx = useContext(SnapshotContext);
  if (!ctx) throw new Error('useSnapshot must be used within SnapshotProvider');
  return ctx;
}

// Unified data source hook — routes reads to snapshot or live API.
// Write operations always go through apiFetch regardless of auth state.
export function useDataSource() {
  const { token } = useAuth();
  const { db, loading: snapshotLoading } = useSnapshot();

  const isLive = !!token || !db;
  const isReady = !snapshotLoading;

  async function fetchCurrentDay() {
    if (isLive) return apiFetch('/api/current-day');
    return getCurrentDay(db);
  }

  async function fetchWorkoutDay(dayNumber) {
    if (isLive) return apiFetch(`/api/workout-days/${dayNumber}`);
    return getWorkoutDay(db, dayNumber);
  }

  async function fetchExercises(dayNumber) {
    if (isLive) return apiFetch(`/api/exercises/day/${dayNumber}`);
    return getExercisesForDay(db, dayNumber);
  }

  async function fetchWorkouts() {
    if (isLive) return apiFetch('/api/logged-workouts');
    return getLoggedWorkouts(db);
  }

  async function fetchSoreness() {
    if (isLive) return apiFetch('/api/soreness');
    return getSorenessEntries(db);
  }

  return {
    fetchCurrentDay,
    fetchWorkoutDay,
    fetchExercises,
    fetchWorkouts,
    fetchSoreness,
    isLive,
    isReady,
  };
}
