export function getTodayParts() {
  const today = new Date();
  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    day: today.getDate(),
  };
}

export function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
