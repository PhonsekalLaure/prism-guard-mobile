import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/leave${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Leave request failed");
  }

  return data;
}

export const fetchLeaveCredits = async () => {
  const data = await request("/credits");
  return data.availableCredits ?? 0;
};

export const submitLeaveRequest = async ({
  leaveType,
  startDate,
  endDate,
  reason,
}) =>
  request("/requests", {
    method: "POST",
    body: JSON.stringify({
      leaveType,
      startDate,
      endDate,
      reason,
    }),
  });
