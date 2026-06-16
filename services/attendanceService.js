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
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    error.attendanceLog = data?.attendanceLog;
    throw error;
  }

  return data;
}

export const fetchActiveAttendance = async () => {
  const data = await request("/active");
  return data.attendanceLog;
};

export const createLocationChallenge = async ({
  action,
  siteId,
  attendanceLogId,
  scheduleId,
}) =>
  request("/location-challenge", {
    method: "POST",
    body: JSON.stringify({
      action,
      siteId,
      attendanceLogId,
      scheduleId,
    }),
  });

export const clockIn = async ({
  siteId,
  scheduleId,
  locationEvidence,
}) => {
  const { challengeId } = await createLocationChallenge({
    action: "clock_in",
    siteId,
    scheduleId,
  });
  return request("/clock-in", {
    method: "POST",
    body: JSON.stringify({
      siteId,
      scheduleId,
      challengeId,
      locationEvidence,
    }),
  });
};

export const clockOut = async ({
  attendanceLogId,
  locationEvidence,
}) => {
  const { challengeId } = await createLocationChallenge({
    action: "clock_out",
    attendanceLogId,
  });
  return request("/clock-out", {
    method: "POST",
    body: JSON.stringify({
      attendanceLogId,
      challengeId,
      locationEvidence,
    }),
  });
};
