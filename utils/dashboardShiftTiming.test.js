const test = require("node:test");
const assert = require("node:assert/strict");

const { getActionableShift } = require("./dashboardShiftTiming");

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
    now: new Date("2026-06-27T16:12:00.000Z"),
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
    now: new Date("2026-06-27T16:12:00.000Z"),
    isOnDuty: false,
  });

  assert.equal(shift?.scheduleId, "today-shift");
});