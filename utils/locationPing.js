// utils/locationPing.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function saveLocationPing({
  attendanceLogId,
  latitude,
  longitude,
  isWithinGeofence,
  violationStage,
}) {
  const token = await AsyncStorage.getItem("access_token");
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/location-pings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      attendanceLogId,
      latitude,
      longitude,
      isWithinGeofence,
      violationStage,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to save ping");
  return data;
}
