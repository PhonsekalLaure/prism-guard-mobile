export { getDateKey } from "./dateKeys";

export function getTodayParts() {
  const today = new Date();
  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    day: today.getDate(),
  };
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getClampedDay(year, month, day) {
  return Math.min(day, getDaysInMonth(year, month));
}

export function getAdjacentMonth(year, month, offset) {
  const next = new Date(year, month + offset, 1);
  return {
    month: next.getMonth(),
    year: next.getFullYear(),
  };
}
