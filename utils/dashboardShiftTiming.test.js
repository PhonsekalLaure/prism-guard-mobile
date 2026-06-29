const test = require("node:test");
const assert = require("node:assert/strict");

const { getActionableShift, getShiftClockInAvailability, isShiftClockInAvailable } = require("./dashboardShiftTiming");

test("dashboard selects previous-date overnight shift after midnight", () => {
  const shift = getActionableShift({
    scheduleDays: [
      {
        date: "2026-06-27",
        scheduleId: "marco-night-shift",
        shiftStart: "22:00:00",
        shiftEnd: "10:00:00",
      },
    ],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T00:30:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift?.scheduleId, "marco-night-shift");
});

test("dashboard does not keep previous overnight shift after it ends", () => {
  const shift = getActionableShift({
    scheduleDays: [
      {
        date: "2026-06-27",
        scheduleId: "marco-night-shift",
        shiftStart: "22:00:00",
        shiftEnd: "10:00:00",
      },
    ],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T02:01:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift, null);
});

test("dashboard keeps today's shift as the primary actionable shift", () => {
  const shift = getActionableShift({
    scheduleDays: [
      {
        date: "2026-06-27",
        scheduleId: "previous-night-shift",
        shiftStart: "22:00:00",
        shiftEnd: "10:00:00",
      },
      {
        date: "2026-06-28",
        scheduleId: "today-shift",
        shiftStart: "09:00:00",
        shiftEnd: "18:00:00",
      },
    ],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T00:30:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift?.scheduleId, "today-shift");
});
test("dashboard does not expose today's shift before the 30-minute early clock-in window", () => {
  const shift = getActionableShift({
    scheduleDays: [
      {
        date: "2026-06-28",
        scheduleId: "today-shift",
        shiftStart: "14:00:00",
        shiftEnd: "02:00:00",
      },
    ],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T05:29:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift, null);
});

test("dashboard exposes today's shift at exactly 30 minutes before shift start", () => {
  const todayShift = {
    date: "2026-06-28",
    scheduleId: "today-shift",
    shiftStart: "14:00:00",
    shiftEnd: "02:00:00",
  };
  const shift = getActionableShift({
    scheduleDays: [todayShift],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T05:30:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift?.scheduleId, "today-shift");
  assert.equal(isShiftClockInAvailable(todayShift, new Date("2026-06-28T05:30:00.000Z")), true);
});

test("dashboard still exposes a very late clock-in before scheduled shift end", () => {
  const shift = getActionableShift({
    scheduleDays: [
      {
        date: "2026-06-28",
        scheduleId: "today-shift",
        shiftStart: "14:00:00",
        shiftEnd: "02:00:00",
      },
    ],
    todayDateKey: "2026-06-28",
    now: new Date("2026-06-28T12:00:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift?.scheduleId, "today-shift");
});
test("dashboard distinguishes a closed same-day clock-in window from a future one", () => {
  const todayShift = {
    date: "2026-06-28",
    scheduleId: "today-shift",
    shiftStart: "14:00:00",
    shiftEnd: "02:00:00",
  };

  const early = getShiftClockInAvailability(todayShift, new Date("2026-06-28T05:29:00.000Z"));
  const ended = getShiftClockInAvailability(todayShift, new Date("2026-06-28T18:01:00.000Z"));

  assert.equal(early.code, "too_early");
  assert.equal(ended.code, "ended");
  assert.equal(early.available, false);
  assert.equal(ended.available, false);
});