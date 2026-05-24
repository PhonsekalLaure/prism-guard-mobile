// utils/pushNotifications.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { saveLocationPing } from "@/utils/locationPing";
import { validateGuardLocation } from "@/utils/geofence";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(employeeId) {
  try {
    // 1. Ask permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission denied");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "d7ae4ded-1239-4b0e-a42c-70b8a13cd95c",
    });
    const token = tokenData.data;

    const accessToken = await AsyncStorage.getItem("access_token");
    const response = await fetch(`${BASE_URL}/api/mobile/device-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        employeeId,
        token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to save push token");
    }

    return token;
  } catch (err) {
    console.error("Failed to register push token:", err);
    return null;
  }
}

export async function registerStoredProfilePushToken() {
  const profileRaw = await AsyncStorage.getItem("profile");
  if (!profileRaw) return null;

  try {
    const profile = JSON.parse(profileRaw);
    if (!profile?.id) return null;
    return await registerPushToken(profile.id);
  } catch (err) {
    console.error("Failed to register stored profile push token:", err);
    return null;
  }
}

export function addNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { checkType, attendanceLogId, route, screen } =
      response.notification.request.content.data || {};

    if (route === "/(tabs)/leave" || screen === "leave") {
      router.push("/(tabs)/leave");
      return;
    }

    if (!checkType) return;

    try {
      const deploymentRaw = await AsyncStorage.getItem("active_deployment");
      if (!deploymentRaw) return;

      const deployment = JSON.parse(deploymentRaw);
      if (!deployment?.client_sites) return;

      const result = await validateGuardLocation(deployment.client_sites);

      await saveLocationPing({
        attendanceLogId: attendanceLogId || null,
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      console.log(`Checkpoint ping saved for ${checkType}`);
    } catch (err) {
      console.error("Checkpoint ping failed:", err);
    }
  });
}
