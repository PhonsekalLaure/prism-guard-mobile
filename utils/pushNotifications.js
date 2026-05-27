// utils/pushNotifications.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { saveLocationPing } from "@/utils/locationPing";
import { validateGuardLocation } from "@/utils/geofence";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const EXPO_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId;

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  const response = await fetch(`${BASE_URL}/api/mobile/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseJsonResponse(response);
  if (!response.ok || !data.session?.access_token) {
    return null;
  }

  await AsyncStorage.setItem("access_token", data.session.access_token);
  await AsyncStorage.setItem("refresh_token", data.session.refresh_token || refreshToken);
  return data.session.access_token;
}

async function savePushToken({ employeeId, token, platform, accessToken }) {
  const response = await fetch(`${BASE_URL}/api/mobile/device-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      employeeId,
      token,
      platform,
    }),
  });

  const data = await parseJsonResponse(response);
  return { response, data };
}

export async function registerPushToken(employeeId) {
  try {
    if (!EXPO_PROJECT_ID) {
      console.warn("Push token registration skipped: Expo project ID is missing");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
      });
    }

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
      projectId: EXPO_PROJECT_ID,
    });
    const token = tokenData.data;

    const accessToken = await AsyncStorage.getItem("access_token");
    if (!accessToken) return null;

    let { response, data } = await savePushToken({
      employeeId,
      token,
      platform: Platform.OS,
      accessToken,
    });

    if (response.status === 401) {
      const refreshedToken = await refreshAccessToken();
      if (!refreshedToken) {
        console.warn("Push token registration skipped: session is expired");
        return null;
      }

      ({ response, data } = await savePushToken({
        employeeId,
        token,
        platform: Platform.OS,
        accessToken: refreshedToken,
      }));
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to save push token");
    }

    return token;
  } catch (err) {
    console.warn("Failed to register push token:", err.message || err);
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
    console.warn("Failed to register stored profile push token:", err.message || err);
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
