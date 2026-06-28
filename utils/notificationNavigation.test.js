const test = require("node:test");
const assert = require("node:assert/strict");

const { getNotificationRoute } = require("./notificationNavigation");

test("routes guard incident notifications to the incident detail", () => {
  assert.equal(
    getNotificationRoute({
      screen: "report",
      route: "/(tabs)/report",
      incidentId: "incident-1",
    }),
    "/incident/incident-1",
  );
});

test("routes leave notifications to the focused leave request", () => {
  assert.equal(
    getNotificationRoute({
      screen: "leave",
      route: "/(tabs)/leave",
      leaveRequestId: "leave-1",
    }),
    "/(tabs)/leave?requestId=leave-1",
  );
});

test("routes cash advance notifications to the focused request", () => {
  assert.equal(
    getNotificationRoute({
      screen: "cash_advance",
      cashAdvanceId: "advance-1",
    }),
    "/cash-advance?requestId=advance-1",
  );
});

test("keeps schedule notifications focused by log date", () => {
  assert.equal(
    getNotificationRoute({
      screen: "schedule",
      route: "/(tabs)/schedule",
      logDate: "2026-06-28",
    }),
    "/(tabs)/schedule?date=2026-06-28",
  );
});
