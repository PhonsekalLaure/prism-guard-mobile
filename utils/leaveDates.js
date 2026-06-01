import { getDateKey, getMonthKey } from "./dateKeys";

export { getDateKey, getMonthKey };

export function countInclusiveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function getTodayDateKey() {
  const today = new Date();
  return getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

export function parseDateKey(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ""))) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function getDateRange(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(getDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function isDateRangeScheduled(startDate, endDate, scheduledDates = []) {
  const scheduledSet = new Set(scheduledDates);
  const dates = getDateRange(startDate, endDate);
  return dates.length > 0 && dates.every((date) => scheduledSet.has(date));
}

export function formatLeaveDate(dateStr, fallback = "-") {
  if (!dateStr) return fallback;

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
