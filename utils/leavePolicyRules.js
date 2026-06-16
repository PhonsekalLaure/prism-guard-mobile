function normalizeEmployeeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male" || normalized === "m") return "male";
  if (normalized === "female" || normalized === "f") return "female";
  return null;
}

function isLeaveTypeAvailableForGender(leaveType, gender) {
  const normalizedGender = normalizeEmployeeGender(gender);
  if (leaveType === "maternity") return normalizedGender === "female";
  if (leaveType === "paternity") return normalizedGender === "male";
  return true;
}

function getUnavailableLeaveTypeReason(leaveType, gender) {
  if (isLeaveTypeAvailableForGender(leaveType, gender)) return null;
  if (leaveType === "maternity") return "Female employees only";
  if (leaveType === "paternity") return "Male employees only";
  return null;
}

function getScheduledDatesInRange(startDate, endDate, scheduledDates = []) {
  const [from, to] = String(startDate || "").localeCompare(String(endDate || "")) <= 0
    ? [startDate, endDate]
    : [endDate, startDate];
  return [...new Set(scheduledDates)]
    .filter((date) => date >= from && date <= to)
    .sort();
}

module.exports = {
  getScheduledDatesInRange,
  getUnavailableLeaveTypeReason,
  isLeaveTypeAvailableForGender,
  normalizeEmployeeGender,
};
