function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || null;
}

function appendQuery(route, params = {}) {
  const entries = Object.entries(params).filter(([, value]) => (
    value !== undefined && value !== null && value !== ""
  ));
  if (entries.length === 0) return route;

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${route}${route.includes("?") ? "&" : "?"}${query}`;
}

function getNotificationRoute(data = {}) {
  const route = data.route || data.actionUrl || data.action_url || null;
  const screen = data.screen || null;
  const relatedEntityType = data.relatedEntityType || data.related_entity_type || null;
  const relatedEntityId = data.relatedEntityId || data.related_entity_id || null;
  const incidentId = firstValue(
    data.incidentId,
    data.incident_id,
    relatedEntityType === "incident" ? relatedEntityId : null,
  );
  const leaveRequestId = firstValue(
    data.leaveRequestId,
    data.leave_request_id,
    relatedEntityType === "leave_request" ? relatedEntityId : null,
  );
  const cashAdvanceId = firstValue(
    data.cashAdvanceId,
    data.cash_advance_id,
    relatedEntityType === "cash_advance" ? relatedEntityId : null,
  );
  const payrollRecordId = firstValue(data.payrollRecordId, data.payroll_record_id, (
    screen === "payroll_detail"
      ? relatedEntityId
      : null
  ));
  const announcementId = firstValue(data.announcementId, data.announcement_id, (
    screen === "announcement_detail"
      ? relatedEntityId
      : null
  ));

  if (incidentId && (
    screen === "incident_detail"
    || screen === "incident_reports"
    || screen === "report"
    || route === "/(tabs)/report"
  )) {
    return `/incident/${encodeURIComponent(incidentId)}`;
  }

  if (leaveRequestId && (route === "/(tabs)/leave" || screen === "leave")) {
    return appendQuery("/(tabs)/leave", { requestId: leaveRequestId });
  }

  if (cashAdvanceId && screen === "cash_advance") {
    return appendQuery("/cash-advance", { requestId: cashAdvanceId });
  }

  if (screen === "payroll_detail" && payrollRecordId) {
    return `/payroll/${encodeURIComponent(payrollRecordId)}`;
  }

  if (typeof route === "string" && route.startsWith("/payroll/")) {
    return route;
  }

  if (route === "/(tabs)/leave" || screen === "leave") {
    return "/(tabs)/leave";
  }

  if (route === "/(tabs)/schedule" || screen === "schedule") {
    const logDate = data.logDate || data.log_date || null;
    return /^\d{4}-\d{2}-\d{2}$/.test(String(logDate || ""))
      ? `/(tabs)/schedule?date=${encodeURIComponent(logDate)}`
      : "/(tabs)/schedule";
  }

  if (screen === "announcement_detail" && announcementId) {
    return `/announcement/${encodeURIComponent(announcementId)}`;
  }

  if (typeof route === "string" && route.startsWith("/announcement/")) {
    return route;
  }

  if (route === "/announcements" || screen === "announcements") {
    return "/announcements";
  }

  if (typeof route === "string" && route.startsWith("/incident/")) {
    return route;
  }

  if (route === "/(tabs)/report" || screen === "report" || screen === "incident_reports") {
    return "/(tabs)/report";
  }

  if (screen === "cash_advance") {
    return "/cash-advance";
  }

  if (route === "/(tabs)/earnings" || screen === "earnings") {
    return "/(tabs)/earnings";
  }

  if (route === "/(tabs)/profile" || screen === "profile") {
    return "/(tabs)/profile";
  }

  if (route === "/notifications" || screen === "notifications") {
    return "/notifications";
  }

  return null;
}

module.exports = {
  appendQuery,
  getNotificationRoute,
};
