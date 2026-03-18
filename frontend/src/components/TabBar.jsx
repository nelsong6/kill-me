// Vertical sidebar tab navigation — matches bender-world / eight-queens pattern.
// Overlapping-border trick: active tab's right border is removed and extends over
// the sidebar's right edge, visually connecting to the content area.
// Supports collapsed mode: shows only icon for each tab.

import { colors } from '../colors';

const styles = {
  bar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingBottom: 16,
    gap: 0,
    height: '100%',
  },
  wrapper: {
    padding: '1px 0 1px 1px',
    position: 'relative',
    marginBottom: -1,
    zIndex: 0,
  },
  wrapperActive: {
    padding: 0,
    borderLeft: `1px solid ${colors.border.subtle}`,
    borderTop: `1px solid ${colors.border.subtle}`,
    borderBottom: `1px solid ${colors.border.subtle}`,
    borderRight: 'none',
    backgroundColor: colors.bg.raised,
    marginRight: -1,
    zIndex: 1,
  },
  tab: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'transparent',
    WebkitAppearance: 'none',
    appearance: 'none',
    outline: 'none',
    border: 'none',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    letterSpacing: 0.3,
    textAlign: 'left',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '6px 8px',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.text.tertiary,
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: 'auto',
    opacity: 0.6,
  },
};

export function TabBar({ tabs, activeTab, onTabChange, collapsed, onToggleCollapse }) {
  return (
    <div style={styles.bar}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <div
            key={tab.id}
            style={{
              ...styles.wrapper,
              ...(isActive ? styles.wrapperActive : {}),
              ...(isActive && index === 0 ? { borderTop: 'none' } : {}),
            }}
          >
            <button
              onClick={() => onTabChange(tab.id)}
              title={collapsed ? tab.label : undefined}
              style={{
                ...styles.tab,
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? colors.text.primary : colors.text.tertiary,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {Icon && <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />}
              {!collapsed && tab.label}
            </button>
          </div>
        );
      })}
      <button
        onClick={onToggleCollapse}
        style={styles.toggleBtn}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '▶' : '◀'}
      </button>
    </div>
  );
}
