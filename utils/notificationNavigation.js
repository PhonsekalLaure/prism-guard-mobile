export function getNotificationRoute(data = {}) {
  const route = data.route || data.actionUrl || data.action_url || null;
  const screen = data.screen || null;
  const incidentId = data.incidentId || data.incident_id || data.relatedEntityId || data.related_entity_id || null;
  const payrollRecordId = data.payrollRecordId || data.payroll_record_id || (
    screen === "payroll_detail"
      ? (data.relatedEntityId || data.related_entity_id || null)
      : null
  );
  const announcementId = data.announcementId || data.announcement_id || (
    screen === "announcement_detail"
      ? (data.relatedEntityId || data.related_entity_id || null)
      : null
  );

  if (screen === "payroll_detail" && payrollRecordId) {
    return `/payroll/${payrollRecordId}`;
  }

  if (typeof route === "string" && route.startsWith("/payroll/")) {
    return route;
  }

  if (route === "/(tabs)/leave" || screen === "leave") {
    return "/(tabs)/leave";
  }

  if (route === "/(tabs)/schedule" || screen === "schedule") {
    return "/(tabs)/schedule";
  }

  if (screen === "announcement_detail" && announcementId) {
    return `/announcement/${announcementId}`;
  }

  if (typeof route === "string" && route.startsWith("/announcement/")) {
    return route;
  }

  if (route === "/announcements" || screen === "announcements") {
    return "/announcements";
  }

  if (screen === "incident_detail" && incidentId) {
    return `/incident/${incidentId}`;
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
