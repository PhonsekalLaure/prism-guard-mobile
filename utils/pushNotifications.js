// utils/pushNotifications.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

    // 2. Get Expo push token
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: "d7ae4ded-1239-4b0e-a42c-70b8a13cd95c",
});    const token = tokenData.data;

    console.log("Push token:", token);

    // 3. Save token to backend
    const accessToken = await AsyncStorage.getItem("access_token");
    await fetch(`${BASE_URL}/api/mobile/device-tokens`, {
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

    return token;
  } catch (err) {
    console.error("Failed to register push token:", err);
    return null;
  }
}