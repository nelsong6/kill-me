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
