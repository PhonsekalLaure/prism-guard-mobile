import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { useGeofenceMonitor } from "@/hooks/useGeofenceMonitor";
import { fetchActiveAttendance } from "@/services/attendanceService";
import {
  isBackgroundLocationSupported,
  requestAttendanceBackgroundPermission,
  startAttendanceBackgroundTracking,
  stopAttendanceBackgroundTracking,
} from "@/utils/backgroundAttendanceLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";

const ACTIVE_ATTENDANCE_REFRESH_MS = 60 * 1000;
const PERMISSION_PROMPT_KEY = "attendance_background_permission_prompted";

export default function AttendanceGeofenceMonitor() {
  const { deployment, profile } = useActiveDeploymentAccess();
  const [attendanceLogId, setAttendanceLogId] = useState(null);
  const [backgroundTrackingActive, setBackgroundTrackingActive] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const refreshActiveAttendance = useCallback(async () => {
    if (!profile?.id) {
      setAttendanceLogId(null);
      return;
    }

    try {
      const attendanceLog = await fetchActiveAttendance();
      setAttendanceLogId(attendanceLog?.id || null);
    } catch (err) {
      console.warn("Could not refresh attendance monitoring:", err.message || err);
    }
  }, [profile?.id]);

  const enableBackgroundTracking = useCallback(async () => {
    const site = deployment?.client_sites;
    if (!attendanceLogId || !site) return;
    if (AppState.currentState !== "active") {
      setBackgroundTrackingActive(false);
      return;
    }

    try {
      const supported = await isBackgroundLocationSupported();
      if (!supported) {
        setBackgroundTrackingActive(false);
        return;
      }

      const started = await startAttendanceBackgroundTracking({
        attendanceLogId,
        site,
      });
      if (started) {
        setBackgroundTrackingActive(true);
        return;
      }

      const promptKey = `${PERMISSION_PROMPT_KEY}:${attendanceLogId}`;
      const alreadyPrompted = await AsyncStorage.getItem(promptKey);
      if (alreadyPrompted) {
        setBackgroundTrackingActive(false);
        return;
      }
      await AsyncStorage.setItem(promptKey, "true");

      Alert.alert(
        "Allow Background Location",
        "Prism Guard needs location access while you are on duty so it can verify geofence exits when the app is minimized. On Android, the next step opens system settings where you must choose Allow all the time.",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              const granted = await requestAttendanceBackgroundPermission();
              if (!granted) {
                Alert.alert(
                  "Background Location Disabled",
                  "Duty monitoring will work only while the app is open. You can enable background location later in system settings.",
                  Platform.OS === "ios"
                    ? [
                      { text: "Cancel", style: "cancel" },
                      { text: "Open Settings", onPress: () => Linking.openSettings() },
                    ]
                    : [{ text: "OK" }],
                );
                return;
              }

              const trackingStarted = await startAttendanceBackgroundTracking({
                attendanceLogId,
                site,
              });
              setBackgroundTrackingActive(trackingStarted);
            },
          },
        ],
      );
    } catch (err) {
      console.warn("Could not enable background attendance tracking:", err.message || err);
      setBackgroundTrackingActive(false);
    }
  }, [attendanceLogId, deployment]);

  useEffect(() => {
    refreshActiveAttendance();
    const refreshTimer = setInterval(
      refreshActiveAttendance,
      ACTIVE_ATTENDANCE_REFRESH_MS,
    );
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
      if (nextState === "active") refreshActiveAttendance();
    });

    return () => {
      clearInterval(refreshTimer);
      appStateSubscription?.remove?.();
    };
  }, [refreshActiveAttendance]);

  useEffect(() => {
    if (attendanceLogId && deployment?.client_sites) {
      if (appState === "active") {
        enableBackgroundTracking();
      }
      return undefined;
    }

    setBackgroundTrackingActive(false);
    stopAttendanceBackgroundTracking().catch((err) => {
      console.warn("Could not stop background attendance tracking:", err.message || err);
    });
    return undefined;
  }, [appState, attendanceLogId, deployment, enableBackgroundTracking]);

  useGeofenceMonitor(deployment, {
    attendanceLogId,
    enabled: Boolean(profile?.id && attendanceLogId && !backgroundTrackingActive),
  });

  return null;
}
