// hooks/useDeployment.js
import authService from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useDeployment(employeeId) {
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSeq = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestSeq.current += 1;
    };
  }, []);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;

    if (!employeeId) {
      if (mountedRef.current) {
        setDeployment(null);
        setLoading(false);
      }
      return null;
    }

    try {
      if (!quiet && mountedRef.current) setLoading(true);
      if (mountedRef.current) setError(null);
      const response = await authService.authenticatedFetch(
        `${BASE_URL}/api/mobile/deployments/${employeeId}/active`,
        {},
      );

      if (!response.ok) throw new Error("No active deployment");

      const data = await response.json();
      if (!mountedRef.current || seq !== requestSeq.current) return data;
      setDeployment(data);
      await AsyncStorage.setItem("active_deployment", JSON.stringify(data));
      return data;
    } catch (err) {
      if (!mountedRef.current || seq !== requestSeq.current) return null;
      setDeployment(null);
      setError(err.message);
      await AsyncStorage.removeItem("active_deployment");
      return null;
    } finally {
      if (mountedRef.current && seq === requestSeq.current) setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setDeployment(null);
      setLoading(false);
      return;
    }

    async function fetchDeployment() {
      await refresh();
    }

    fetchDeployment();
  }, [employeeId, refresh]);

  return { deployment, loading, error, refresh };
}
