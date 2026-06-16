import { getDateKey } from "./dateKeys";

export { getDateKey };

const BUSINESS_TIME_ZONE = "Asia/Manila";

export function getBusinessTodayParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    month: Number(values.month) - 1,
    year: Number(values.year),
    day: Number(values.day),
  };
}

export function getTodayParts() {
  return getBusinessTodayParts();
}

export function getBusinessDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = getBusinessTodayParts(date);
  return getDateKey(parts.year, parts.month, parts.day);
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
