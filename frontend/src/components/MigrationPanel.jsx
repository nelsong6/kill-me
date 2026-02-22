import { useState } from 'react';
import { migrateLocalStorageToAPI, hasLocalStorageData, checkMigrationStatus } from '../utils/migration';

export function MigrationPanel() {
  const [status, setStatus] = useState('idle'); // idle, migrating, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const hasData = hasLocalStorageData();
  const alreadyMigrated = checkMigrationStatus();

  const handleMigrate = async () => {
    setStatus('migrating');
    setError(null);

    try {
      const migrationResult = await migrateLocalStorageToAPI();
      
      if (migrationResult.success) {
        setStatus('success');
        setResult(migrationResult);
      } else {
        setStatus('error');
        setError(migrationResult.error || 'Migration failed');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const getLocalStorageStats = () => {
    try {
      const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
      const currentDay = localStorage.getItem('currentDay');
      return {
        workoutCount: workouts.length,
        currentDay: currentDay ? parseInt(currentDay) : null
      };
    } catch {
      return { workoutCount: 0, currentDay: null };
    }
  };

  const stats = getLocalStorageStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-cyan-400 mb-2">
          📦 LocalStorage Migration
        </h2>
        <p className="text-slate-400">
          Migrate your workout data from browser storage to Cosmos DB
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LocalStorage Status */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="text-slate-500 text-sm font-medium mb-2">LocalStorage</div>
          <div className="text-3xl font-black text-white mb-1">
            {stats.workoutCount}
          </div>
          <div className="text-slate-400 text-sm">
            {stats.workoutCount === 1 ? 'workout' : 'workouts'} found
          </div>
          {stats.currentDay && (
            <div className="text-slate-500 text-xs mt-2">
              Current day: {stats.currentDay}
            </div>
          )}
        </div>

        {/* Migration Status */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="text-slate-500 text-sm font-medium mb-2">Migration</div>
          <div className="text-2xl font-black mb-1">
            {alreadyMigrated ? (
              <span className="text-green-400">✓ Complete</span>
            ) : hasData ? (
              <span className="text-yellow-400">⚠ Pending</span>
            ) : (
              <span className="text-slate-600">○ No Data</span>
            )}
          </div>
          <div className="text-slate-400 text-sm">
            {alreadyMigrated ? 'Already migrated' : hasData ? 'Ready to migrate' : 'Nothing to migrate'}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-green-700/50 p-6">
            <div className="text-slate-500 text-sm font-medium mb-2">Result</div>
            <div className="text-3xl font-black text-green-400 mb-1">
              {result.migratedCount || 0}
            </div>
            <div className="text-slate-400 text-sm">
              workouts migrated
            </div>
          </div>
        )}
      </div>

      {/* Migration Button */}
      {!alreadyMigrated && hasData && status !== 'success' && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-bold mb-2">
                LocalStorage Data Detected
              </h3>
              <p className="text-slate-300 mb-4">
                Found {stats.workoutCount} workout{stats.workoutCount !== 1 ? 's' : ''} in browser storage. 
                Click below to migrate this data to Cosmos DB.
              </p>
              <button
                onClick={handleMigrate}
                disabled={status === 'migrating'}
                className={`
                  px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all
                  ${status === 'migrating'
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:scale-105 shadow-lg shadow-yellow-500/30'
                  }
                `}
              >
                {status === 'migrating' ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Migrating...
                  </span>
                ) : (
                  '🚀 Start Migration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1">
              <h3 className="text-green-400 font-bold mb-2">
                Migration Successful!
              </h3>
              <p className="text-slate-300 mb-2">
                Successfully migrated {result.migratedCount} workout{result.migratedCount !== 1 ? 's' : ''} to Cosmos DB.
              </p>
              {result.currentDay && (
                <p className="text-slate-400 text-sm">
                  Current day set to: Day {result.currentDay}
                </p>
              )}
              <p className="text-slate-500 text-sm mt-4">
                LocalStorage has been cleared. Your data is now safely stored in the cloud.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">❌</div>
            <div className="flex-1">
              <h3 className="text-red-400 font-bold mb-2">
                Migration Failed
              </h3>
              <p className="text-slate-300 mb-2">
                {error || 'An unknown error occurred during migration.'}
              </p>
              <button
                onClick={handleMigrate}
                className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!hasData && !alreadyMigrated && (
        <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="text-center text-slate-400 py-8">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg">No LocalStorage data found</p>
            <p className="text-sm mt-2 text-slate-500">
              Nothing to migrate - you're all set!
            </p>
          </div>
        </div>
      )}

      {/* Already Migrated Message */}
      {alreadyMigrated && (
        <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="text-center text-slate-400 py-8">
            <div className="text-5xl mb-4">✓</div>
            <p className="text-lg text-green-400">Migration Already Complete</p>
            <p className="text-sm mt-2 text-slate-500">
              Your data has been migrated to Cosmos DB
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-slate-300 font-bold mb-3">ℹ️ About Migration</h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• Migrates all workout data from browser storage to Cosmos DB</li>
          <li>• Preserves all exercise details, sets, reps, and timestamps</li>
          <li>• Migrates your current day setting</li>
          <li>• Clears LocalStorage after successful migration</li>
          <li>• Safe to run multiple times (idempotent)</li>
        </ul>
      </div>
    </div>
  );
}
