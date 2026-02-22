import { useAuth } from '../hooks/useAuth';

export function AuthGuard({ children }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">💪</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4">
            💪 SYNERGY 12
          </h1>
          <p className="text-slate-400 mb-8 text-lg">Sign in to access your workout tracker</p>
          <button
            onClick={login}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return children;
}
