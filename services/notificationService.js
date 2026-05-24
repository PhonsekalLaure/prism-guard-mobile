import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await authService.authenticatedFetch(
    `${BASE_URL}/api/mobile/notifications${path}`,
    options,
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Notification request failed");
  }

  return data;
}

export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 20),
    filter: params.filter || "all",
  });

  const result = await request(`?${query.toString()}`);
  return {
    notifications: result.data || [],
    metadata: result.metadata || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
  };
}

export async function fetchNotificationStats() {
  return request("/stats");
}

export async function markNotificationRead(id) {
  return request(`/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return request("/read-all", { method: "PATCH" });
}

export async function dismissNotification(id) {
  return request(`/${id}/dismiss`, { method: "PATCH" });
}
