import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function DatabaseInit() {
  const [status, setStatus] = useState('idle'); // idle, initializing, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInitialize = async () => {
    setStatus('initializing');
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/init-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { message: text || `HTTP ${response.status}` };
        }
        
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          message: errorData.message || errorData.error || 'Unknown error',
          details: errorData,
          url: response.url
        };
        
        throw new Error(JSON.stringify(errorDetails));
      }

      const data = await response.json();
      setStatus('success');
      setResult(data);
    } catch (err) {
      setStatus('error');
      // Try to parse JSON error details, otherwise use the message
      try {
        const errorObj = JSON.parse(err.message);
        setError(errorObj);
      } catch {
        setError({
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
    }
  };

  return (
    <div className="space-y-6">
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
              curl {API_URL}/health
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
