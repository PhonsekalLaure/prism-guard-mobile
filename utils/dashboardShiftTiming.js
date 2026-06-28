const BUSINESS_UTC_OFFSET = "+08:00";

function parseShiftDateTime(dateKey, timeValue) {
  if (!dateKey || !timeValue) return null;

  const text = String(timeValue).trim();
  if (!text || text === "--") return null;

  const isoDate = new Date(text);
  if (text.includes("T") && !Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const match = text.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) {
    return null;
  }

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${BUSINESS_UTC_OFFSET}`,
  );
}

function getShiftStartEnd(dateKey, shiftStart, shiftEnd) {
  const startAt = parseShiftDateTime(dateKey, shiftStart);
  const endAt = parseShiftDateTime(dateKey, shiftEnd);
  if (!startAt || !endAt) return null;

  const normalizedEndAt = new Date(endAt);
  if (normalizedEndAt <= startAt) {
    normalizedEndAt.setDate(normalizedEndAt.getDate() + 1);
  }

  return { startAt, endAt: normalizedEndAt };
}

function isShiftActiveNow(shift, date = new Date()) {
  if (!shift?.date || !shift?.shiftStart || !shift?.shiftEnd) return false;
  const window = getShiftStartEnd(shift.date, shift.shiftStart, shift.shiftEnd);
  if (!window) return false;
  return date >= window.startAt && date <= window.endAt;
}

function getActionableShift({ scheduleDays = [], selectedShift = null, selectedDate = null, todayDateKey, now = new Date(), isOnDuty = false } = {}) {
  const todayShift = scheduleDays.find((item) => item.date === todayDateKey)
    || (selectedDate === todayDateKey ? selectedShift : null)
    || null;

  const activeOvernightShift = !isOnDuty
    ? scheduleDays.find((item) => item.date < todayDateKey && isShiftActiveNow(item, now)) || null
    : null;

  return todayShift || activeOvernightShift;
}

module.exports = {
  getActionableShift,
  getShiftStartEnd,
  isShiftActiveNow,
  parseShiftDateTime,
};