// services/documentsService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const documentsService = {
  async getDocuments() {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) throw new Error("No session found");

    const response = await fetch(`${BASE_URL}/api/mobile/documents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch documents");
    return data.documents;
  },
};

export default documentsService;