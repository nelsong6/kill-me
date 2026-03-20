// Date utilities — local-timezone-safe formatting.
// new Date().toISOString().split('T')[0] uses UTC, which rolls to the next day
// in the evening for western timezones. These helpers use local time instead.

// Returns today as YYYY-MM-DD in local timezone.
export function todayLocal() {
  return dateToLocal(new Date());
}

// Formats any Date object as YYYY-MM-DD in local timezone.
export function dateToLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns current local time as HH:MM (24-hour).
export function nowLocalTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Formats HH:MM (24-hour) to a display string like "5:30 PM".
export function formatTime12h(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
