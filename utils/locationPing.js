// utils/locationPing.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response");
  }
}

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("Session expired");

  const response = await fetch(`${BASE_URL}/api/mobile/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseResponse(response);
  if (!response.ok || !data.session?.access_token) {
    throw new Error(data.error || "Session expired");
  }

  await AsyncStorage.setItem("access_token", data.session.access_token);
  await AsyncStorage.setItem(
    "refresh_token",
    data.session.refresh_token || refreshToken,
  );
  return data.session.access_token;
}

async function postLocationPing(token, body) {
  return fetch(`${BASE_URL}/api/mobile/location-pings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function saveLocationPing({
  attendanceLogId,
  latitude,
  longitude,
}) {
  let token = await AsyncStorage.getItem("access_token");
  if (!token) throw new Error("No session found");

  const body = { attendanceLogId, latitude, longitude };
  let response = await postLocationPing(token, body);
  if (response.status === 401) {
    token = await refreshAccessToken();
    response = await postLocationPing(token, body);
  }

  const data = await parseResponse(response);
  if (!response.ok) throw new Error(data.error || "Failed to save ping");
  return data;
}
