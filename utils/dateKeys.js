export function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
