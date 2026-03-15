// Root application component. Three tabs:
//   - History (default): calendar/list view of past workouts with color-coded days
//   - Today: shows current day in the 12-day cycle with quick/detailed logging
//   - Admin (localhost only + admin role): database init and data migration
//
// Auth model: anyone can view (History/Today tabs load publicly). Only the
// admin user (whitelisted Microsoft email) sees logging buttons, the workout
// drawer, and the admin tab.

import { useState } from 'react';
import { useWorkouts } from './hooks/useWorkouts';
import { useAuth } from './auth/AuthContext.jsx';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { DatabaseInit } from './components/DatabaseInit';
import { WorkoutDrawer } from './components/WorkoutDrawer';
import { UserProfile } from './components/UserProfile';
import { isAdminMode } from './utils/adminMode';

function App() {
  const [activeTab, setActiveTab] = useState('history');
  const { isAdmin, loading } = useAuth();
  const { currentDay, setDay } = useWorkouts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialDay, setDrawerInitialDay] = useState(null);
  const [drawerInitialDate, setDrawerInitialDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Admin tab requires both localhost dev mode AND admin role
  const showAdminTab = isAdminMode() && isAdmin;

  const handleOpenDrawer = (dayNumber = null, date = null) => {
    setDrawerInitialDay(dayNumber);
    setDrawerInitialDate(date);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerInitialDay(null);
    setDrawerInitialDate(null);
  };

  const handleWorkoutSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'history', label: 'History', icon: '📊' },
    { id: 'today', label: 'Today', icon: '🏋️' },
    ...(showAdminTab ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              💪 SYNERGY 12
            </h1>
            {showAdminTab && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <span className="text-yellow-400 text-xs font-bold">⚡ ADMIN</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <UserProfile />
            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">
                Build: {__BUILD_NUMBER__}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-t-2xl border-b-2 border-slate-700/50 p-3">
          <div className="flex gap-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-blue-500/50 scale-105'
                    : 'bg-slate-800/40 text-slate-500 hover:bg-slate-700/60 hover:text-slate-300 border border-slate-700'
                  }
                `}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-b-2xl border border-t-0 border-slate-700/50 p-8 min-h-[600px]">
          {activeTab === 'today' && (
            <div className="animate-fadeIn">
              <TodayTab currentDay={currentDay} onDayChange={setDay} isAdmin={isAdmin} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fadeIn">
              <HistoryTab key={refreshKey} onDayClick={isAdmin ? handleOpenDrawer : undefined} />
            </div>
          )}

          {activeTab === 'admin' && showAdminTab && (
            <div className="animate-fadeIn space-y-8">
              <DatabaseInit />
            </div>
          )}
        </div>

      </div>

      {/* Workout Drawer — only available for admin */}
      {isAdmin && (
        <WorkoutDrawer
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          initialDay={drawerInitialDay}
          initialDate={drawerInitialDate}
          currentDay={currentDay}
          onSuccess={handleWorkoutSuccess}
          onOpenDrawer={handleOpenDrawer}
        />
      )}
    </div>
  );
}

export default App;
