const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getScheduledDatesInRange,
  getUnavailableLeaveTypeReason,
  isLeaveTypeAvailableForGender,
  normalizeEmployeeGender,
} = require("./leavePolicyRules");

test("leave type availability follows employee gender", () => {
  assert.equal(normalizeEmployeeGender("M"), "male");
  assert.equal(normalizeEmployeeGender("Female"), "female");
  assert.equal(isLeaveTypeAvailableForGender("paternity", "male"), true);
  assert.equal(isLeaveTypeAvailableForGender("paternity", "female"), false);
  assert.equal(isLeaveTypeAvailableForGender("maternity", "female"), true);
  assert.equal(isLeaveTypeAvailableForGender("maternity", "male"), false);
  assert.equal(isLeaveTypeAvailableForGender("sick", null), true);
  assert.equal(getUnavailableLeaveTypeReason("maternity", null), "Female employees only");
});

test("standard SIL range resolves to scheduled dates only", () => {
  const scheduled = [
    "2026-06-22",
    "2026-06-23",
    "2026-06-24",
    "2026-06-26",
  ];

  assert.deepEqual(
    getScheduledDatesInRange("2026-06-22", "2026-06-24", scheduled),
    ["2026-06-22", "2026-06-23", "2026-06-24"],
  );
  assert.deepEqual(
    getScheduledDatesInRange("2026-06-26", "2026-06-22", scheduled),
    ["2026-06-22", "2026-06-23", "2026-06-24", "2026-06-26"],
  );
});
