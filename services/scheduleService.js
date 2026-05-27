import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path) {
  const response = await authService.authenticatedFetch(`${BASE_URL}/api/mobile/schedule${path}`, {
    method: "GET",
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response");
    }
  }

  if (!response.ok) {
    throw new Error(data.error || "Schedule request failed");
  }

  return data;
}

export function fetchMonthlySchedule({ year, month, selectedDate } = {}) {
  const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  const params = new URLSearchParams({ month: monthValue });

  if (selectedDate) {
    params.set("date", selectedDate);
  }

  return request(`?${params.toString()}`);
}
