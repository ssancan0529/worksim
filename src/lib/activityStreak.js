function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOrdinal(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function normalizeActivityStreak(value) {
  if (!isRecord(value) || !isDateKey(value.lastActiveDate)) {
    return { current: 0, lastActiveDate: null };
  }
  const current = Number.isSafeInteger(value.current) && value.current > 0 ? value.current : 0;
  return { current, lastActiveDate: value.lastActiveDate };
}

export function recordActivity(streak, date = new Date()) {
  const current = normalizeActivityStreak(streak);
  const today = getLocalDateKey(date);
  if (current.lastActiveDate === today) return current;

  const consecutive = current.lastActiveDate
    && dateOrdinal(today) - dateOrdinal(current.lastActiveDate) === 1;
  return {
    current: consecutive ? current.current + 1 : 1,
    lastActiveDate: today,
  };
}

export function getCurrentActivityStreak(streak, date = new Date()) {
  const current = normalizeActivityStreak(streak);
  if (!current.lastActiveDate) return 0;
  const daysSinceActivity = dateOrdinal(getLocalDateKey(date)) - dateOrdinal(current.lastActiveDate);
  return daysSinceActivity >= 0 && daysSinceActivity <= 1 ? current.current : 0;
}
