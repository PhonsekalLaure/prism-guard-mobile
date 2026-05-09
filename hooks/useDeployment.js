// hooks/useDeployment.js
import authService from "@/services/authService";
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
        const token = await authService.getToken();

        console.log("EMPLOYEE ID:", employeeId); // 👈
        console.log(
          "FETCHING URL:",
          `${BASE_URL}/api/mobile/deployments/${employeeId}/active`,
        ); // 👈

        const response = await fetch(
          `${BASE_URL}/api/mobile/deployments/${employeeId}/active`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("DEPLOYMENT STATUS:", response.status); // 👈
        const data = await response.json();
        console.log("DEPLOYMENT DATA:", JSON.stringify(data, null, 2)); // 👈

        if (!response.ok) throw new Error("No active deployment");

        setDeployment(data);
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
