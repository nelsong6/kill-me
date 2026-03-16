// Admin-only panel for initializing the Cosmos DB database and seeding it,
// plus day override controls for manually changing the current cycle day.
// Calls POST /api/admin/init-database which creates the database/container
// if they don't exist and upserts seed data. Only visible in admin mode
// (localhost + dev). The backend uses DefaultAzureCredential, so the developer
// must be logged into Azure CLI (`az login`) for this to work locally.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../api/client.js';
import { DAY_CONFIG } from '../utils/dayConfig';

export function DatabaseInit({ currentDay, onDayChange }) {
  const [status, setStatus] = useState('idle'); // idle, initializing, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [sorenessStatus, setSorenessStatus] = useState('idle');
  const [sorenessResult, setSorenessResult] = useState(null);

  const handleInitialize = async () => {
    setStatus('initializing');
    setError(null);
    setResult(null);

    try {
      const data = await apiFetch('/api/admin/init-database', {
        method: 'POST',
      });
      setStatus('success');
      setResult(data);
    } catch (err) {
      setStatus('error');
      setError({
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
  };

  const handleSeedSoreness = async () => {
    setSorenessStatus('initializing');
    setSorenessResult(null);
    try {
      const data = await apiFetch('/api/admin/seed-soreness', { method: 'POST' });
      setSorenessStatus('success');
      setSorenessResult(data);
    } catch (err) {
      setSorenessStatus('error');
      setSorenessResult({ error: err.message });
    }
  };

  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [selectedDay, setSelectedDay] = useState(currentDay);

  const handleDaySelect = (e) => {
    const day = parseInt(e.target.value);
    setSelectedDay(day);
    onDayChange(day);
  };

  return (
    <div className="space-y-6">
      {/* Day Override */}
      <div>
        <h2 className="text-3xl font-black text-cyan-400 mb-2">
          Day Override
        </h2>
        <p className="text-slate-400 mb-4">
          Manually change the current day in the 12-day cycle
        </p>
        <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="space-y-4">
            <button
              onClick={() => setOverrideEnabled(!overrideEnabled)}
              className={`w-full py-3 px-6 rounded-lg font-bold uppercase tracking-wide transition-all ${
                overrideEnabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-slate-700/60 hover:bg-slate-600/60 text-slate-300'
              }`}
            >
              {overrideEnabled ? '🔓 Override Active' : '🔒 Enable Day Override'}
            </button>

            <div className="relative">
              <select
                value={selectedDay}
                onChange={handleDaySelect}
                disabled={!overrideEnabled}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all appearance-none cursor-pointer ${
                  overrideEnabled
                    ? 'bg-slate-700 border-2 border-cyan-500/50 text-slate-200 hover:border-cyan-400 focus:outline-none focus:border-cyan-400'
                    : 'bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed'
                }`}
                style={{ paddingRight: '2.5rem' }}
              >
                {Object.entries(DAY_CONFIG).map(([dayNum, dayInfo]) => (
                  <option key={dayNum} value={dayNum}>
                    Day {dayNum}: {dayInfo.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className={`w-5 h-5 ${overrideEnabled ? 'text-cyan-400' : 'text-slate-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {overrideEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-center"
              >
                <p className="text-amber-300 text-sm font-medium">
                  ⚠️ Manual day override is active
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-cyan-400 mb-2">
          🗄️ Database Initialization
        </h2>
        <p className="text-slate-400">
          Initialize Cosmos DB database and container if they don't exist
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-slate-300 font-bold mb-3">ℹ️ What This Does</h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• Creates database if it doesn't exist</li>
          <li>• Creates container with partition key <code className="text-cyan-400">/userId</code></li>
          <li>• Safe to run multiple times (idempotent)</li>
          <li>• Required before migrating data or using the app</li>
          <li>• Uses your Azure CLI credentials</li>
        </ul>
      </div>

      {/* Initialize Button */}
      {status === 'idle' && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1">
              <h3 className="text-blue-400 font-bold mb-2">
                Initialize Database
              </h3>
              <p className="text-slate-300 mb-4">
                This will create the database and container in Cosmos DB if they don't already exist.
                This is required before you can store any workout data.
              </p>
              <button
                onClick={handleInitialize}
                className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                🗄️ Initialize Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initializing State */}
      {status === 'initializing' && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-spin">⚙️</div>
            <div>
              <h3 className="text-blue-400 font-bold mb-1">
                Initializing Database...
              </h3>
              <p className="text-slate-400 text-sm">
                Creating database and container in Cosmos DB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && result && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1">
              <h3 className="text-green-400 font-bold mb-2">
                Database Initialized Successfully!
              </h3>
              <p className="text-slate-300 mb-4">
                {result.message}
              </p>
              
              <div className="bg-slate-900/60 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Database:</span>
                  <span className="text-cyan-400 font-mono">{result.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Container:</span>
                  <span className="text-cyan-400 font-mono">{result.container}</span>
                </div>
                {result.created && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Database Created:</span>
                      <span className={result.created.database ? "text-green-400" : "text-yellow-400"}>
                        {result.created.database ? 'Yes (new)' : 'No (existed)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Container Created:</span>
                      <span className={result.created.container ? "text-green-400" : "text-yellow-400"}>
                        {result.created.container ? 'Yes (new)' : 'No (existed)'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-slate-500 text-sm mt-4">
                ✓ Database is ready for use
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">❌</div>
            <div className="flex-1">
              <h3 className="text-red-400 font-bold mb-2">
                Initialization Failed
              </h3>
              <p className="text-slate-300 mb-4">
                {typeof error === 'string' ? error : error.message || 'An unknown error occurred during initialization.'}
              </p>
              
              {/* Error Details */}
              {typeof error === 'object' && (
                <div className="space-y-3 mb-4">
                  {error.status && (
                    <div className="bg-slate-900/60 rounded-lg p-4">
                      <div className="text-xs font-bold text-red-400 mb-2">HTTP Response</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex gap-2">
                          <span className="text-slate-500">Status:</span>
                          <span className="text-red-400 font-mono">{error.status} {error.statusText}</span>
                        </div>
                        {error.url && (
                          <div className="flex gap-2">
                            <span className="text-slate-500">URL:</span>
                            <span className="text-slate-400 font-mono text-xs break-all">{error.url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {error.details && (
                    <details className="bg-slate-900/60 rounded-lg p-4">
                      <summary className="text-xs font-bold text-yellow-400 cursor-pointer hover:text-yellow-300">
                        📋 Full Error Details (click to expand)
                      </summary>
                      <pre className="mt-3 text-xs text-slate-300 overflow-x-auto p-3 bg-slate-950 rounded border border-slate-700">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {error.stack && (
                    <details className="bg-slate-900/60 rounded-lg p-4">
                      <summary className="text-xs font-bold text-yellow-400 cursor-pointer hover:text-yellow-300">
                        🔍 Stack Trace (click to expand)
                      </summary>
                      <pre className="mt-3 text-xs text-red-300 overflow-x-auto p-3 bg-slate-950 rounded border border-red-900/50 font-mono">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="bg-slate-900/60 rounded-lg p-4 text-sm text-slate-400 mb-4">
                <p className="font-bold mb-2">Common Issues:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Not logged in to Azure CLI (<code className="text-cyan-400">az login</code>)</li>
                  <li>Insufficient permissions on Cosmos DB</li>
                  <li>API not running or not accessible</li>
                  <li>Incorrect environment variables (COSMOS_DB_ENDPOINT)</li>
                  <li>Network connectivity issues</li>
                </ul>
              </div>

              <button
                onClick={handleInitialize}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Soreness Data */}
      <div>
        <h2 className="text-3xl font-black text-cyan-400 mb-2">
          Seed Soreness Journal
        </h2>
        <p className="text-slate-400 mb-4">
          Import soreness entries from the spreadsheet (40 entries, Nov 2025 – Feb 2026)
        </p>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          {sorenessStatus === 'idle' && (
            <button
              onClick={handleSeedSoreness}
              className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-purple-500 to-cyan-600 text-white hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              Seed Soreness Data
            </button>
          )}
          {sorenessStatus === 'initializing' && (
            <div className="flex items-center gap-4">
              <div className="text-2xl animate-spin">⚙️</div>
              <p className="text-slate-400">Seeding soreness entries...</p>
            </div>
          )}
          {sorenessStatus === 'success' && sorenessResult && (
            <div className="space-y-2">
              <p className="text-green-400 font-bold">✅ {sorenessResult.message}</p>
              <p className="text-slate-400 text-sm">
                {sorenessResult.seeded} of {sorenessResult.total} entries seeded (idempotent — safe to re-run)
              </p>
              <button
                onClick={handleSeedSoreness}
                className="mt-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Run Again
              </button>
            </div>
          )}
          {sorenessStatus === 'error' && sorenessResult && (
            <div className="space-y-2">
              <p className="text-red-400 font-bold">❌ Failed to seed soreness data</p>
              <p className="text-slate-400 text-sm">{sorenessResult.error}</p>
              <button
                onClick={handleSeedSoreness}
                className="mt-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-slate-300 font-bold mb-3">🔧 Troubleshooting</h3>
        <div className="space-y-3 text-sm text-slate-400">
          <div>
            <p className="font-bold text-slate-300 mb-1">1. Check Azure CLI Login</p>
            <code className="block bg-slate-950 p-2 rounded text-cyan-400">
              az account show
            </code>
          </div>
          
          <div>
            <p className="font-bold text-slate-300 mb-1">2. Check API is Running</p>
            <code className="block bg-slate-950 p-2 rounded text-cyan-400">
              {"curl http://localhost:3000/health"}
            </code>
          </div>
          
          <div>
            <p className="font-bold text-slate-300 mb-1">3. Verify Permissions</p>
            <p>Your user needs Cosmos DB Data Contributor role on the resource group</p>
          </div>
        </div>
      </div>
    </div>
  );
}
