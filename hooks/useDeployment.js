// hooks/useDeployment.js
import authService from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useDeployment(employeeId) {
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeeId) return;

    async function fetchDeployment() {
      try {
        const response = await authService.authenticatedFetch(
          `${BASE_URL}/api/mobile/deployments/${employeeId}/active`,
          {},
        );

        if (!response.ok) throw new Error("No active deployment");

        const data = await response.json();
        setDeployment(data);

        // Cache deployment for notification handler
        await AsyncStorage.setItem("active_deployment", JSON.stringify(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDeployment();
  }, [employeeId]);

  return { deployment, loading, error };
}
