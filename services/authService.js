import AsyncStorage from "@react-native-async-storage/async-storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Notifications from "expo-notifications";
import { registerPushToken } from "@/utils/pushNotifications";
import { stopAttendanceBackgroundTracking } from "@/utils/backgroundAttendanceLocation";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response");
  }
}

async function clearRuntimeSessionState() {
  await stopAttendanceBackgroundTracking().catch(() => null);
  const keys = await AsyncStorage.getAllKeys();
  const geofenceKeys = keys.filter((key) => key.startsWith("geofence_"));

  await AsyncStorage.multiRemove([
    "active_deployment",
    ...geofenceKeys,
  ]);

  await Promise.all([
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => null),
    Notifications.dismissAllNotificationsAsync().catch(() => null),
  ]);
}

const authService = {
  async login(email, password) {
    await clearRuntimeSessionState();

    const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    await AsyncStorage.setItem("access_token", data.session.access_token);
    await AsyncStorage.setItem("refresh_token", data.session.refresh_token);
    await AsyncStorage.setItem("profile", JSON.stringify(data.profile));
    await AsyncStorage.setItem("user_email", data.user.email);
    if (data.profile?.id) {
      registerPushToken(data.profile.id);
    }

    return data;
  },

  async forgotPassword(identifier) {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Failed to send reset code");
    }

    return data;
  },

  async resetPasswordWithCode(identifier, code, password) {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, code, password }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password");
    }

    return data;
  },

  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await this.authenticatedFetch(
      `${BASE_URL}/api/mobile/auth/change-password`,
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      }
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Failed to change password");
    }

    return data;
  },

  async getMe() {
    const response = await this.authenticatedFetch(`${BASE_URL}/api/mobile/auth/me`, {
      method: "GET",
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Session invalid");
    }

    return data;
  },

  async logout() {
    await clearRuntimeSessionState();
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    await AsyncStorage.removeItem("profile");
    await AsyncStorage.removeItem("user_email");
  },

  async getToken() {
    return await AsyncStorage.getItem("access_token");
  },

  async refreshSession() {
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token found");

    const response = await fetch(`${BASE_URL}/api/mobile/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      await this.logout();
      throw new Error(data.error || "Session expired");
    }

    if (!data.session?.access_token) {
      await this.logout();
      throw new Error("Session expired");
    }

    await AsyncStorage.setItem("access_token", data.session.access_token);
    await AsyncStorage.setItem("refresh_token", data.session.refresh_token || refreshToken);
    return data.session.access_token;
  },

  async authenticatedFetch(url, options = {}) {
    const token = await this.getToken();
    if (!token) throw new Error("No session found");

    const buildOptions = (accessToken) => ({
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let response = await fetch(url, buildOptions(token));
    if (response.status !== 401) return response;

    const refreshedToken = await this.refreshSession();
    return await fetch(url, buildOptions(refreshedToken));
  },

  async getProfile() {
    const profile = await AsyncStorage.getItem("profile");
    if (!profile) return null;

    try {
      return JSON.parse(profile);
    } catch {
      await AsyncStorage.removeItem("profile");
      return null;
    }
  },

  async updateAvatar(uri) {
    const compressed = await manipulateAsync(
      uri,
      [{ resize: { width: 600 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    const response = await fetch(compressed.uri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const apiResponse = await this.authenticatedFetch(
      `${BASE_URL}/api/mobile/auth/avatar`,
      {
        method: 'PATCH',
        body: JSON.stringify({ imageBase64: base64, fileExt: 'jpg' }),
      }
    );

    const data = await parseJsonResponse(apiResponse);
    if (!apiResponse.ok) throw new Error(data.error || 'Failed to update avatar');
    return data;
  },

  async changeEmail(email) {
    if (!email || !email.trim()) {
      throw new Error('Please enter a valid email address.');
    }

    const apiResponse = await this.authenticatedFetch(
      `${BASE_URL}/api/mobile/auth/change-email`,
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }
    );

    const data = await parseJsonResponse(apiResponse);
    if (!apiResponse.ok) throw new Error(data.error || 'Failed to request email change');
    return data;
  },

  async confirmEmailChange(code) {
    const apiResponse = await this.authenticatedFetch(
      `${BASE_URL}/api/mobile/auth/confirm-email-change`,
      {
        method: 'POST',
        body: JSON.stringify({ code: String(code || '').trim() }),
      }
    );

    const data = await parseJsonResponse(apiResponse);
    if (!apiResponse.ok) throw new Error(data.error || 'Failed to confirm email change');
    return data;
  },
};

export default authService;
