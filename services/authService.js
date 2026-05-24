import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerPushToken } from "@/utils/pushNotifications";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const authService = {
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

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

    const data = await response.json().catch(() => ({}));

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data.error || "Failed to reset password");
      throw err;
    }

    return data;
  },

  async getMe() {
    const response = await this.authenticatedFetch(`${BASE_URL}/api/mobile/auth/me`, {
      method: "GET",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Session invalid");
    }

    return data;
  },

  async logout() {
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

    const data = await response.json().catch(() => ({}));
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
    return profile ? JSON.parse(profile) : null;
  },
};

export default authService;
