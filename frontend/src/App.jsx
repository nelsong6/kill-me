// Root application component. Left sidebar tab navigation (matches bender-world /
// eight-queens pattern). Tabs:
//   - History (default): calendar/list view of past workouts with color-coded days
//   - Workout: detailed view of any day in the cycle (defaults to current day)
//   - Cycle: Synergy 12 overview — philosophy, day breakdown, recovery notes
//   - Soreness: daily muscle soreness journal with structured muscle picker
//   - Log (admin only): log a workout with quick or detailed mode
//   - Admin (localhost only + admin role): day override, database init and data migration
//
// Auth model: anyone can view (History/Today tabs load publicly). Only the
// admin user (whitelisted Microsoft email) sees the Log tab and the Admin tab.

import { useState } from 'react';
import { useWorkouts } from './hooks/useWorkouts';
import { useAuth } from './auth/AuthContext.jsx';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { DatabaseInit } from './components/DatabaseInit';
import { LogTab } from './components/WorkoutDrawer';
import { UserProfile } from './components/UserProfile';
import { TabBar } from './components/TabBar';
import { CycleTab } from './components/CycleTab';
import { SorenessTab } from './components/SorenessTab';
import { isAdminMode } from './utils/adminMode';
import { colors } from './colors';

function App() {
  const [activeTab, setActiveTab] = useState('history');
  const { isAdmin, loading } = useAuth();
  const { currentDay, setDay, setCurrentDay } = useWorkouts();
  const [logInitialDay, setLogInitialDay] = useState(null);
  const [logInitialDate, setLogInitialDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Admin tab requires both localhost dev mode AND admin role
  const showAdminTab = isAdminMode() && isAdmin;

  // Navigate to Log tab, optionally pre-filling day/date (e.g. from calendar click)
  const handleOpenLog = (dayNumber = null, date = null) => {
    setLogInitialDay(dayNumber);
    setLogInitialDate(date);
    setActiveTab('log');
  };

  const handleWorkoutSuccess = (advancedTo) => {
    if (advancedTo) {
      setCurrentDay(advancedTo);
    }
    setRefreshKey(prev => prev + 1);
    setLogInitialDay(null);
    setLogInitialDate(null);
    setActiveTab('history');
  };

  const tabs = [
    { id: 'history', label: 'History' },
    { id: 'today', label: 'Workout' },
    { id: 'cycle', label: 'Cycle' },
    { id: 'soreness', label: 'Soreness' },
    ...(isAdmin ? [{ id: 'log', label: 'Log' }] : []),
    ...(showAdminTab ? [{ id: 'admin', label: 'Admin' }] : [])
  ];

  if (loading) {
    return (
      <div style={{ ...styles.app, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.text.tertiary, fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* ═══════════════════════════════════════════════ */}
      {/* STICKY TOP SECTION                             */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={styles.stickyTop}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>SYNERGY 12</h1>
            <p style={styles.subtitle}>12-day training cycle</p>
          </div>
          <div style={styles.headerRight}>
            <UserProfile />
            {showAdminTab && (
              <div style={styles.adminBadge}>
                <span style={{ color: colors.accent.amber, fontSize: 11, fontWeight: 'bold' }}>ADMIN</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: colors.text.disabled, fontFamily: 'monospace' }}>
              {__BUILD_NUMBER__}
            </div>
          </div>
        </header>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN CONTENT                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={styles.main}>
        {/* Left sidebar: vertical tabs */}
        <div style={styles.leftSidebar}>
          <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab content area */}
        <div style={styles.tabContent}>
          {activeTab === 'today' && (
            <TodayTab currentDay={currentDay} isAdmin={isAdmin} />
          )}

          {activeTab === 'history' && (
            <HistoryTab key={refreshKey} onDayClick={isAdmin ? handleOpenLog : undefined} />
          )}

          {activeTab === 'cycle' && (
            <CycleTab currentDay={currentDay} />
          )}

          {activeTab === 'soreness' && (
            <SorenessTab isAdmin={isAdmin} />
          )}

          {activeTab === 'log' && isAdmin && (
            <LogTab
              initialDay={logInitialDay}
              initialDate={logInitialDate}
              currentDay={currentDay}
              onSuccess={handleWorkoutSuccess}
            />
          )}

          {activeTab === 'admin' && showAdminTab && (
            <DatabaseInit currentDay={currentDay} onDayChange={setDay} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  app: {
    height: '100vh',
    backgroundColor: colors.bg.base,
    color: colors.text.primary,
    fontFamily: "'Segoe UI', 'Roboto', monospace",
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  stickyTop: {
    flexShrink: 0,
    zIndex: 160,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: colors.bg.raised,
    borderBottom: `1px solid ${colors.border.subtle}`,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  subtitle: {
    margin: '3px 0 0 0',
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  adminBadge: {
    padding: '2px 8px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 4,
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  leftSidebar: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.raised,
    borderRight: `1px solid ${colors.border.subtle}`,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    padding: '12px 24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
};
