import { useState } from 'react';
import { useWorkouts } from './hooks/useWorkouts';
import { useAuth } from './hooks/useAuth';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { MigrationPanel } from './components/MigrationPanel';
import { DatabaseInit } from './components/DatabaseInit';
import { WorkoutDrawer } from './components/WorkoutDrawer';
import { AuthGuard } from './components/AuthGuard';
import { UserProfile } from './components/UserProfile';
import { isAdminMode } from './utils/adminMode';

function App() {
  const [activeTab, setActiveTab] = useState('history');
  const { getToken } = useAuth();
  const { currentDay, setDay } = useWorkouts(getToken);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialDay, setDrawerInitialDay] = useState(null);
  const [drawerInitialDate, setDrawerInitialDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adminMode = isAdminMode();

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
    // Trigger refresh in HistoryTab by incrementing key
    setRefreshKey(prev => prev + 1);
  };
  
  const tabs = [
    { id: 'history', label: 'History', icon: '📊' },
    { id: 'today', label: 'Today', icon: '🏋️' },
    ...(adminMode ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : [])
  ];

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              💪 SYNERGY 12
            </h1>
            {adminMode && (
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
              <TodayTab currentDay={currentDay} onDayChange={setDay} getToken={getToken} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fadeIn">
              <HistoryTab key={refreshKey} onDayClick={handleOpenDrawer} getToken={getToken} />
            </div>
          )}

          {activeTab === 'admin' && adminMode && (
            <div className="animate-fadeIn space-y-8">
              <DatabaseInit />
              <div className="border-t border-slate-700/50 my-8"></div>
              <MigrationPanel />
            </div>
          )}
        </div>

      </div>

      {/* Workout Drawer */}
      <WorkoutDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        initialDay={drawerInitialDay}
        initialDate={drawerInitialDate}
        currentDay={currentDay}
        onSuccess={handleWorkoutSuccess}
        onOpenDrawer={handleOpenDrawer}
        getToken={getToken}
      />
    </div>
    </AuthGuard>
  );
}

export default App;
