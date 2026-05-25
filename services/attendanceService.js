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

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || response.statusText || 'Attendance request failed';
    throw new Error(message);
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