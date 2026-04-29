import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const authService = {
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || "Login failed");
      throw err;
    }

    // Persist tokens and profile locally
    await AsyncStorage.setItem("access_token", data.session.access_token);
    await AsyncStorage.setItem("refresh_token", data.session.refresh_token);
    await AsyncStorage.setItem("profile", JSON.stringify(data.profile));

    return data;
  },

  async getMe() {
    const token = await AsyncStorage.getItem("access_token");

    if (!token) {
      throw new Error("No session found");
    }

    const response = await fetch(`${BASE_URL}/api/mobile/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || "Session invalid");
      throw err;
    }

    return data;
  },

  async logout() {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    await AsyncStorage.removeItem("profile");
  },

  async getToken() {
    return await AsyncStorage.getItem("access_token");
  },

  async getProfile() {
    const profile = await AsyncStorage.getItem("profile");
    return profile ? JSON.parse(profile) : null;
  },
};

export default authService;
