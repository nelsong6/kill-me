// Vertical sidebar tab navigation — matches bender-world / eight-queens pattern.
// Overlapping-border trick: active tab's right border is removed and extends over
// the sidebar's right edge, visually connecting to the content area.

import { colors } from '../colors';

const styles = {
  bar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingBottom: 16,
    gap: 0,
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
    padding: '10px 16px',
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'transparent',
    WebkitAppearance: 'none',
    appearance: 'none',
    outline: 'none',
    border: 'none',
    width: '100%',
    display: 'block',
    whiteSpace: 'nowrap',
    letterSpacing: 0.3,
    textAlign: 'left',
    cursor: 'pointer',
  },
};

export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={styles.bar}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
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
              style={{
                ...styles.tab,
                color: isActive ? colors.text.primary : colors.text.tertiary,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {tab.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
