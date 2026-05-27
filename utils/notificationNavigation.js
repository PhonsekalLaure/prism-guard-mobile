export function getNotificationRoute(data = {}) {
  const route = data.route || data.actionUrl || data.action_url || null;
  const screen = data.screen || null;

  if (route === "/(tabs)/leave" || screen === "leave") {
    return "/(tabs)/leave";
  }

  if (route === "/(tabs)/schedule" || screen === "schedule") {
    return "/(tabs)/schedule";
  }

  if (route === "/(tabs)/report" || screen === "report" || screen === "incident_reports") {
    return "/(tabs)/report";
  }

  if (route === "/notifications" || screen === "notifications") {
    return "/notifications";
  }

  return null;
}
