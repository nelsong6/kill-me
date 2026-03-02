import { useAuth } from '../hooks/useAuth';

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full border-2 border-cyan-500/50"
        />
      )}
      <span className="text-slate-400 text-sm font-medium hidden md:block">{user.email}</span>
      <button
        onClick={logout}
        className="text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
