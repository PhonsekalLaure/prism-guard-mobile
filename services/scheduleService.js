import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path) {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/schedule${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
}

export function fetchMonthlySchedule({ year, month, selectedDate } = {}) {
  const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  const params = new URLSearchParams({ month: monthValue });
  if (selectedDate) params.set("date", selectedDate);
  return request(`?${params.toString()}`);
}