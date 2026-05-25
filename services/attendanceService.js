import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/attendance${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Attendance request failed");
  }

  return data;
}

export const fetchActiveAttendance = async () => {
  const data = await request("/active");
  return data.attendanceLog;
};

export const clockIn = async ({
  siteId,
  scheduleId,
  latitude,
  longitude,
}) =>
  request("/clock-in", {
    method: "POST",
    body: JSON.stringify({
      siteId,
      scheduleId,
      latitude,
      longitude,
    }),
  });

export const clockOut = async ({
  attendanceLogId,
  latitude,
  longitude,
}) =>
  request("/clock-out", {
    method: "POST",
    body: JSON.stringify({
      attendanceLogId,
      latitude,
      longitude,
    }),
  });
