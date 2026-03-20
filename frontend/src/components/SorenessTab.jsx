// Soreness journal tab — tracks daily muscle soreness with structured muscle
// selection (group → specific muscle) and 1-10 severity levels.
//
// Public: anyone can view the soreness history.
// Admin: can add/edit soreness entries via the muscle picker.
//
// Data model: one document per date with an array of { group, muscle, level }.

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { useDataSource } from '../api/snapshotContext.jsx';
import { MUSCLE_TAXONOMY, MUSCLE_GROUPS, searchMuscles } from '../utils/muscleTaxonomy';
import { todayLocal } from '../utils/dateUtils';
import { AnatomyDiagram } from './AnatomyDiagrams';
import { colors } from '../colors';
import { Wrench } from 'lucide-react';

// Map soreness levels to colors (green → yellow → red gradient)
function getLevelColor(level) {
  if (level <= 2) return colors.accent.green;
  if (level <= 4) return colors.accent.cyan;
  if (level <= 6) return colors.accent.gold;
  if (level <= 8) return colors.accent.amber;
  return colors.accent.red;
}

function getLevelLabel(level) {
  if (level <= 2) return 'Mild';
  if (level <= 4) return 'Noticeable';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'Significant';
  return 'Severe';
}

// Format date as "Mon, Jan 15"
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Alias for readability within this component
const todayStr = todayLocal;

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return mobile;
}

export function SorenessTab({ isAdmin }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchSoreness, isReady } = useDataSource();
  const isMobile = useIsMobile();

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState(todayStr());
  const [originalDate, setOriginalDate] = useState(null); // tracks pre-edit date for moves
  const [editMuscles, setEditMuscles] = useState([]);
  const [saving, setSaving] = useState(false);

  // Muscle picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMuscle, setHoveredMuscle] = useState(null); // { group, muscle } for diagram highlight

  // List view — pinned muscle stays visible; hover temporarily overrides
  const [pinnedMuscle, setPinnedMuscle] = useState(null); // { group, muscle }
  const [listHover, setListHover] = useState(null); // { group, muscle }

  // Fetch entries
  useEffect(() => {
    if (!isReady) return;
    loadEntries();
  }, [isReady]);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await fetchSoreness();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Search results
  const searchResults = useMemo(() => searchMuscles(searchQuery), [searchQuery]);

  // Start editing a date (new or existing).
  // For new entries, carry forward the most recent soreness entry since soreness
  // commonly persists across multiple days. Carried-forward muscles are marked
  // so the UI can show them as dismissable suggestions.
  function startEdit(date, existingMuscles = []) {
    setEditDate(date);
    setOriginalDate(existingMuscles.length > 0 ? date : null);
    if (existingMuscles.length > 0) {
      setEditMuscles(existingMuscles.map(m => ({ ...m })));
    } else {
      // Pre-populate from the most recent entry (entries are sorted newest-first)
      const previous = entries.length > 0 ? entries[0].muscles : [];
      setEditMuscles(previous.map(m => ({ ...m, carryForward: true })));
    }
    setEditing(true);
    setPickerOpen(false);
    setExpandedGroup(null);
    setSearchQuery('');
  }

  // Add a muscle to the current edit. muscleName can be null for group-level soreness.
  function addMuscle(group, muscleName) {
    // Don't add duplicates
    if (editMuscles.some(m => m.group === group && m.muscle === muscleName)) return;
    setEditMuscles([...editMuscles, { group, muscle: muscleName, level: 5 }]);
    setPickerOpen(false);
    setSearchQuery('');
  }

  // Update level for a muscle in the edit — also clears carryForward flag
  // since adjusting the slider means the user has accepted this muscle.
  function setLevel(index, level) {
    const updated = [...editMuscles];
    const { carryForward, ...rest } = updated[index];
    updated[index] = { ...rest, level };
    setEditMuscles(updated);
  }

  // Remove a muscle from the edit
  function removeMuscle(index) {
    setEditMuscles(editMuscles.filter((_, i) => i !== index));
  }

  // Save the entry
  async function saveEntry() {
    try {
      setSaving(true);
      if (editMuscles.length === 0) {
        // If all muscles removed, delete the entry
        try {
          await apiFetch(`/api/soreness/${editDate}`, { method: 'DELETE' });
        } catch {
          // Entry might not exist yet, that's fine
        }
      } else {
        // Strip carryForward flag before persisting
        const cleanMuscles = editMuscles.map(({ carryForward, ...rest }) => rest);
        await apiFetch('/api/soreness', {
          method: 'POST',
          body: JSON.stringify({ date: editDate, muscles: cleanMuscles }),
        });
      }
      // If date was changed on an existing entry, delete the old one
      if (originalDate && originalDate !== editDate) {
        try {
          await apiFetch(`/api/soreness/${originalDate}`, { method: 'DELETE' });
        } catch {
          // Old entry might already be gone
        }
      }
      setEditing(false);
      await loadEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ color: colors.text.tertiary, padding: 24 }}>Loading soreness data...</div>;
  }

  // The group to show in the diagram panel — either the expanded picker group or
  // the hovered muscle's group (hovered takes priority for search results).
  const diagramGroup = hoveredMuscle?.group || expandedGroup;

  // Editor view
  if (editing && isAdmin) {
    return (
      <div style={{ maxWidth: 960, overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setEditing(false)} style={styles.backBtn}>
            &larr; Back
          </button>
          <h2 style={styles.heading}>
            {formatDate(editDate)}
          </h2>
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: colors.text.secondary, fontSize: 12, marginRight: 8 }}>Date:</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        {/* Two-column layout: left = muscles + picker, right = anatomy diagram (single column on mobile) */}
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', overflowX: isMobile ? 'auto' : undefined }}>
          {/* Left column — muscle list + picker */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Current muscles */}
            <div style={{ marginBottom: 16 }}>
              {editMuscles.some(m => m.carryForward) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 10px', borderRadius: 6, background: colors.bg.tertiary }}>
                  <span style={{ fontSize: 12, color: colors.text.secondary, flex: 1 }}>
                    Carried forward from previous entry
                  </span>
                  <button
                    onClick={() => setEditMuscles(editMuscles.filter(m => !m.carryForward))}
                    style={{ fontSize: 11, color: colors.accent.amber, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    Dismiss all
                  </button>
                </div>
              )}
              {editMuscles.length === 0 ? (
                <p style={{ color: colors.text.tertiary, fontSize: 13 }}>No muscles added yet. Use the picker below.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editMuscles.map((m, i) => (
                    <div key={`${m.group}-${m.muscle || 'group'}`} style={{
                      ...styles.muscleEntry,
                      ...(m.carryForward ? { borderLeft: `3px solid ${colors.accent.amber}` } : {}),
                      ...(isMobile ? { flexWrap: 'wrap', gap: 8, padding: '8px 10px' } : {}),
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: colors.text.primary, fontWeight: 600 }}>
                          {m.muscle || m.group}
                        </div>
                        {m.muscle && <div style={{ fontSize: 11, color: colors.text.tertiary }}>{m.group}</div>}
                      </div>

                      {/* Level slider */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={m.level}
                          onChange={(e) => setLevel(i, parseInt(e.target.value))}
                          style={{ width: 100, accentColor: getLevelColor(m.level) }}
                        />
                        <span style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: getLevelColor(m.level),
                          minWidth: 20,
                          textAlign: 'center'
                        }}>
                          {m.level}
                        </span>
                        <span style={{ fontSize: 10, color: colors.text.tertiary, minWidth: 60 }}>
                          {getLevelLabel(m.level)}
                        </span>
                      </div>

                      <button onClick={() => removeMuscle(i)} style={styles.removeBtn}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add muscle button / picker */}
            {!pickerOpen ? (
              <button onClick={() => setPickerOpen(true)} style={styles.addBtn}>
                + Add Muscle
              </button>
            ) : (
              <MusclePicker
                expandedGroup={expandedGroup}
                onExpandGroup={setExpandedGroup}
                onSelect={addMuscle}
                onClose={() => { setPickerOpen(false); setSearchQuery(''); setHoveredMuscle(null); }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchResults={searchResults}
                existingMuscles={editMuscles}
                onHoverMuscle={setHoveredMuscle}
              />
            )}

            {/* Save */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={saveEntry} disabled={saving} style={styles.saveBtn}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>

            {error && <p style={{ color: colors.accent.red, fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>

          {/* Right column — anatomy diagram, shown when picker is open and a group is active */}
          {pickerOpen && diagramGroup && (
            <div style={{ ...styles.diagramPanel, ...(isMobile ? { width: 220, flexShrink: 0 } : {}) }}>
              <AnatomyDiagram group={diagramGroup} highlightMuscle={hoveredMuscle?.muscle} />
              {hoveredMuscle?.muscle && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent.cyan }}>
                    {hoveredMuscle.muscle}
                  </div>
                  <div style={{ fontSize: 11, color: colors.text.tertiary }}>
                    {MUSCLE_TAXONOMY[hoveredMuscle.group]?.muscles.find(
                      m => m.name === hoveredMuscle.muscle
                    )?.location}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active muscle for the diagram: hover takes priority, then pinned
  const activeMuscle = listHover || pinnedMuscle;
  const activeDiagramGroup = activeMuscle?.group;

  // List view
  return (
    <div style={{ maxWidth: isMobile ? undefined : 960, display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', overflowX: 'auto' }}>
      {/* Left column — entry list */}
      <div style={{ flex: '1 0 auto', minWidth: 0, ...(isMobile ? { width: 'calc(100vw - 80px)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={styles.heading}>Soreness Journal</h2>
            <p style={{ color: colors.text.tertiary, fontSize: 12, margin: '4px 0 0 0' }}>
              Daily muscle soreness tracking
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => startEdit(todayStr(), findEntryMuscles(entries, todayStr()))} style={styles.addBtn}>
              + Log Soreness
            </button>
          )}
        </div>

        {error && <p style={{ color: colors.accent.red, fontSize: 12, marginBottom: 12 }}>{error}</p>}

        {entries.length === 0 ? (
          <p style={{ color: colors.text.tertiary, fontSize: 14 }}>No soreness entries yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map((entry) => (
              <div
                key={entry.date}
                style={{
                  ...styles.entryRow,
                  ...(isMobile ? { flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '10px 12px' } : {}),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <div>
                    <div style={{ fontSize: 13, color: colors.text.secondary, fontWeight: 600 }}>
                      {formatDate(entry.date)}
                    </div>
                    <div style={{ fontSize: 10, color: colors.text.disabled }}>{entry.date}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => startEdit(entry.date, entry.muscles)}
                      style={styles.editIconBtn}
                      title="Edit entry"
                    >
                      <Wrench size={13} />
                    </button>
                  )}
                </div>
                <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {entry.muscles.map((m) => {
                    const isPinned = pinnedMuscle?.group === m.group && pinnedMuscle?.muscle === m.muscle;
                    return (
                      <div
                        key={`${m.group}-${m.muscle || 'group'}`}
                        onClick={() => setPinnedMuscle(isPinned ? null : { group: m.group, muscle: m.muscle })}
                        onMouseEnter={() => setListHover({ group: m.group, muscle: m.muscle })}
                        onMouseLeave={() => setListHover(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 6,
                          fontSize: 13,
                          cursor: 'pointer',
                          borderRadius: 4,
                          padding: '1px 4px',
                          margin: '0 -4px',
                          backgroundColor: isPinned ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
                        }}
                      >
                        <span style={{ color: getLevelColor(m.level), fontWeight: 'bold', minWidth: 16, textAlign: 'right' }}>
                          {m.level}
                        </span>
                        <span style={{ color: isPinned ? colors.accent.cyan : colors.text.secondary }}>
                          {m.muscle
                            ? <>{m.group} <span style={{ color: colors.text.tertiary }}>›</span> {m.muscle}</>
                            : m.group
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column — anatomy diagram (pinned or hovered muscle), scrollable on mobile */}
      <div style={{
        ...styles.diagramPanel,
        ...(isMobile ? { width: 220, flexShrink: 0 } : {}),
        opacity: activeDiagramGroup ? 1 : 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: activeDiagramGroup ? 'auto' : 'none',
      }}>
        {activeDiagramGroup ? (
          <>
            <AnatomyDiagram group={activeDiagramGroup} highlightMuscle={activeMuscle?.muscle} />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent.cyan }}>
                {activeMuscle?.muscle || activeDiagramGroup}
              </div>
              {activeMuscle?.muscle && (
                <div style={{ fontSize: 11, color: colors.text.tertiary }}>
                  {MUSCLE_TAXONOMY[activeDiagramGroup]?.muscles.find(
                    m => m.name === activeMuscle.muscle
                  )?.location}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 300 }} />
        )}
      </div>
    </div>
  );
}

// Find muscles for a given date from entries array
function findEntryMuscles(entries, date) {
  const entry = entries.find(e => e.date === date);
  return entry ? entry.muscles : [];
}

// Muscle picker — browse groups or search.
// onHoverMuscle({ group, muscle }) drives the right-panel anatomy diagram.
function MusclePicker({ expandedGroup, onExpandGroup, onSelect, onClose, searchQuery, onSearchChange, searchResults, existingMuscles, onHoverMuscle }) {
  const isAlreadyAdded = (group, muscle) =>
    existingMuscles.some(m => m.group === group && m.muscle === muscle);
  const isGroupAdded = (group) =>
    existingMuscles.some(m => m.group === group && !m.muscle);

  return (
    <div style={styles.pickerContainer}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary }}>Select Muscle</span>
        <button onClick={onClose} style={styles.removeBtn}>✕</button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search muscles..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={styles.searchInput}
        autoFocus
      />

      {/* Search results */}
      {searchQuery.length >= 2 ? (
        <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 8 }}>
          {searchResults.length === 0 ? (
            <p style={{ color: colors.text.tertiary, fontSize: 12 }}>No matches</p>
          ) : (
            searchResults.map((r) => (
              <button
                key={`${r.group}-${r.muscle || 'group'}`}
                onClick={() => onSelect(r.group, r.muscle)}
                onMouseEnter={() => onHoverMuscle({ group: r.group, muscle: r.muscle })}
                onMouseLeave={() => onHoverMuscle(null)}
                disabled={r.muscle ? isAlreadyAdded(r.group, r.muscle) : isGroupAdded(r.group)}
                style={{
                  ...styles.muscleOption,
                  opacity: (r.muscle ? isAlreadyAdded(r.group, r.muscle) : isGroupAdded(r.group)) ? 0.4 : 1,
                }}
              >
                <span style={{ color: r.muscle ? colors.text.primary : colors.accent.cyan, fontSize: 13, fontWeight: r.muscle ? 400 : 600 }}>
                  {r.muscle || `${r.group} (general)`}
                </span>
                <span style={{ color: colors.text.disabled, fontSize: 11 }}>
                  {r.muscle ? `${r.group} · ${r.location}` : 'Whole group'}
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        /* Group browse */
        <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 8 }}>
          {MUSCLE_GROUPS.map((group) => (
            <div key={group}>
              <button
                onClick={() => onExpandGroup(expandedGroup === group ? null : group)}
                style={{
                  ...styles.groupBtn,
                  backgroundColor: expandedGroup === group ? colors.bg.overlay : 'transparent',
                }}
              >
                <span style={{ color: colors.text.primary, fontSize: 13, fontWeight: 600 }}>{group}</span>
                <span style={{ color: colors.text.disabled, fontSize: 11 }}>
                  {MUSCLE_TAXONOMY[group].muscles.length} muscles {expandedGroup === group ? '▾' : '▸'}
                </span>
              </button>

              {expandedGroup === group && (
                <div style={{ paddingLeft: 8 }}>
                  {/* Group-level option */}
                  <button
                    onClick={() => onSelect(group, null)}
                    onMouseEnter={() => onHoverMuscle({ group, muscle: null })}
                    onMouseLeave={() => onHoverMuscle(null)}
                    disabled={isGroupAdded(group)}
                    style={{
                      ...styles.muscleOption,
                      opacity: isGroupAdded(group) ? 0.4 : 1,
                      backgroundColor: 'rgba(34, 211, 238, 0.05)',
                    }}
                  >
                    <span style={{ color: colors.accent.cyan, fontSize: 13, fontWeight: 600 }}>{group} (general)</span>
                    <span style={{ color: colors.text.disabled, fontSize: 11 }}>Whole group, not a specific muscle</span>
                  </button>

                  {/* Muscle list — diagram moved to right panel */}
                  {MUSCLE_TAXONOMY[group].muscles.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => onSelect(group, m.name)}
                      onMouseEnter={() => onHoverMuscle({ group, muscle: m.name })}
                      onMouseLeave={() => onHoverMuscle(null)}
                      disabled={isAlreadyAdded(group, m.name)}
                      style={{
                        ...styles.muscleOption,
                        opacity: isAlreadyAdded(group, m.name) ? 0.4 : 1,
                      }}
                    >
                      <span style={{ color: colors.text.primary, fontSize: 13 }}>{m.name}</span>
                      <span style={{ color: colors.text.disabled, fontSize: 11 }}>{m.location}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  heading: {
    margin: 0,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  backBtn: {
    background: 'none',
    border: `1px solid ${colors.border.subtle}`,
    color: colors.text.secondary,
    padding: '4px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  dateInput: {
    background: colors.bg.surface,
    border: `1px solid ${colors.border.subtle}`,
    color: colors.text.primary,
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'monospace',
    colorScheme: 'dark',
  },
  entryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 16px',
    padding: '10px 14px',
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: 8,
  },
  editIconBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.disabled,
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    opacity: 0.6,
  },
  musclePill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 500,
  },
  muscleEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: 8,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.disabled,
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 8px',
  },
  addBtn: {
    background: 'none',
    border: `1px solid ${colors.accent.cyan}`,
    color: colors.accent.cyan,
    padding: '6px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  saveBtn: {
    backgroundColor: colors.accent.cyan,
    border: 'none',
    color: colors.bg.base,
    padding: '8px 24px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelBtn: {
    background: 'none',
    border: `1px solid ${colors.border.subtle}`,
    color: colors.text.secondary,
    padding: '8px 24px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  diagramPanel: {
    width: 300,
    flexShrink: 0,
    position: 'sticky',
    top: 80,
    padding: 16,
    backgroundColor: colors.bg.raised,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: 10,
  },
  pickerContainer: {
    backgroundColor: colors.bg.raised,
    border: `1px solid ${colors.border.strong}`,
    borderRadius: 10,
    padding: 16,
  },
  searchInput: {
    width: '100%',
    background: colors.bg.surface,
    border: `1px solid ${colors.border.subtle}`,
    color: colors.text.primary,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  groupBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${colors.border.subtle}`,
    cursor: 'pointer',
    textAlign: 'left',
  },
  muscleOption: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${colors.border.subtle}`,
    cursor: 'pointer',
    textAlign: 'left',
    gap: 2,
  },
};
