import { useAuth } from '../auth/AuthContext.jsx';
import { loginWithMicrosoft } from '../auth/msal.js';

export function UserProfile() {
  const { user, isAdmin, logout } = useAuth();

  if (!user) {
    return (
      <button
        onClick={loginWithMicrosoft}
        className="inline-flex items-center gap-3 px-3 py-2 rounded border border-slate-600 bg-slate-800/50 text-slate-300 text-sm font-semibold cursor-pointer hover:bg-slate-700/50 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 flex items-center justify-center text-xs font-semibold text-cyan-300">
        {user.name?.charAt(0).toUpperCase()}
      </div>
      <span className="text-slate-400 text-sm font-medium hidden md:block">{user.name}</span>
      {!isAdmin && (
        <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
          View only
        </span>
      )}
      <button
        onClick={logout}
        className="text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
