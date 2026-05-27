import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const ActiveDeploymentAccessContext = createContext(null);

function getFullName(profile) {
  return profile ? `${profile.first_name} ${profile.last_name}` : "Officer";
}

function getDisplayId(profile) {
  return profile?.employee_id_number || "PRISM-----";
}

export function ActiveDeploymentAccessProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [deployment, setDeployment] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [deploymentLoading, setDeploymentLoading] = useState(true);
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

  const refreshAccess = useCallback(async ({ quiet = false } = {}) => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;

    if (!quiet) {
      setProfileLoading(true);
      setDeploymentLoading(true);
      setDeployment(null);
    }
    setError(null);

    try {
      const [storedProfile, storedEmail] = await Promise.all([
        authService.getProfile(),
        AsyncStorage.getItem("user_email"),
      ]);

      if (!mountedRef.current || seq !== requestSeq.current) return null;

      setProfile(storedProfile || null);
      setEmail(storedProfile?.contact_email || storedEmail || "");
      setProfileLoading(false);

      if (!storedProfile?.id) {
        setDeployment(null);
        setDeploymentLoading(false);
        return null;
      }

      const response = await authService.authenticatedFetch(
        `${BASE_URL}/api/mobile/deployments/${storedProfile.id}/active`,
        {},
      );

      if (!response.ok) throw new Error("No active deployment");

      const nextDeployment = await response.json();
      if (!mountedRef.current || seq !== requestSeq.current) return nextDeployment;

      setDeployment(nextDeployment);
      await AsyncStorage.setItem("active_deployment", JSON.stringify(nextDeployment));
      setDeploymentLoading(false);
      return nextDeployment;
    } catch (err) {
      if (!mountedRef.current || seq !== requestSeq.current) return null;

      setDeployment(null);
      setError(err.message);
      await AsyncStorage.removeItem("active_deployment");
      setProfileLoading(false);
      setDeploymentLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAccess();
  }, [refreshAccess]);

  const value = useMemo(() => ({
    profile,
    fullName: getFullName(profile),
    displayId: getDisplayId(profile),
    email,
    phone: profile?.phone_number || "",
    address: profile?.residential_address || "",
    emergencyName: profile?.emergency_contact_name || "",
    emergencyNum: profile?.emergency_contact_number || "",
    deployment,
    profileLoading,
    deploymentLoading,
    loading: profileLoading || deploymentLoading,
    error,
    canAccessRestrictedActions: Boolean(deployment),
    refreshAccess,
  }), [
    deployment,
    deploymentLoading,
    email,
    error,
    profile,
    profileLoading,
    refreshAccess,
  ]);

  return (
    <ActiveDeploymentAccessContext.Provider value={value}>
      {children}
    </ActiveDeploymentAccessContext.Provider>
  );
}

export function useActiveDeploymentAccess() {
  const context = useContext(ActiveDeploymentAccessContext);
  if (!context) {
    throw new Error("useActiveDeploymentAccess must be used within ActiveDeploymentAccessProvider");
  }
  return context;
}
