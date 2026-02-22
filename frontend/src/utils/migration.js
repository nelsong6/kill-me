// Migration utility to move data from LocalStorage to Cosmos DB

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_ID = 'anonymous'; // TODO: Replace with actual user ID from auth

const MIGRATION_KEY = 'workout-migration-completed';
const WORKOUTS_KEY = 'workouts';
const CURRENT_DAY_KEY = 'currentDay';

export const checkMigrationStatus = () => {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
};

export const hasLocalStorageData = () => {
  const workouts = localStorage.getItem(WORKOUTS_KEY);
  return workouts && workouts !== '[]';
};

export const migrateLocalStorageToAPI = async () => {
  try {
    // Check if already migrated
    if (checkMigrationStatus()) {
      console.log('✅ Migration already completed');
      return { success: true, alreadyMigrated: true };
    }

    // Check if there's data to migrate
    if (!hasLocalStorageData()) {
      console.log('ℹ️ No local storage data to migrate');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return { success: true, noData: true };
    }

    // Get data from localStorage
    const workoutsJson = localStorage.getItem(WORKOUTS_KEY);
    const currentDay = localStorage.getItem(CURRENT_DAY_KEY);
    const workouts = JSON.parse(workoutsJson || '[]');

    console.log(`📦 Found ${workouts.length} workouts in LocalStorage`);

    // Migrate workouts
    let migratedCount = 0;
    if (workouts.length > 0) {
      const response = await fetch(`${API_URL}/api/workouts/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
        body: JSON.stringify({ workouts })
      });

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`);
      }

      const result = await response.json();
      migratedCount = result.success;
      console.log(`✅ Migrated ${migratedCount} workouts successfully`);

      if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} workouts failed to migrate`);
      }
    }

    // Migrate current day
    if (currentDay) {
      const dayResponse = await fetch(`${API_URL}/api/current-day`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': USER_ID
        },
        body: JSON.stringify({ currentDay: parseInt(currentDay) })
      });

      if (dayResponse.ok) {
        console.log(`✅ Migrated current day: ${currentDay}`);
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(WORKOUTS_KEY);
    localStorage.removeItem(CURRENT_DAY_KEY);
    localStorage.setItem(MIGRATION_KEY, 'true');

    console.log('✅ Migration completed and LocalStorage cleared');

    return {
      success: true,
      migratedCount,
      currentDay: currentDay ? parseInt(currentDay) : null
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getMigrationPrompt = () => {
  if (checkMigrationStatus()) {
    return null;
  }

  if (!hasLocalStorageData()) {
    // Mark as migrated if there's no data
    localStorage.setItem(MIGRATION_KEY, 'true');
    return null;
  }

  const workoutsJson = localStorage.getItem(WORKOUTS_KEY);
  const workouts = JSON.parse(workoutsJson || '[]');

  return {
    message: `We found ${workouts.length} workout(s) in your browser storage. Would you like to migrate them to the cloud?`,
    workoutCount: workouts.length
  };
};
