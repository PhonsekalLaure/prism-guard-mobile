import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { validateGuardLocation } from "@/utils/geofence";
import { saveLocationPing } from "@/utils/locationPing";

const CHECK_INTERVAL_MS = 2 * 60 * 1000;
const NOTIFY_AFTER_MS = 5 * 60 * 1000;
const REVIEW_AFTER_MS = 15 * 60 * 1000;
const OUTSIDE_SINCE_KEY = "geofence_outside_since";
const NOTIFIED_KEY = "geofence_guard_notified";
const REVIEW_FLAGGED_KEY = "geofence_review_flagged";

function getStateKey(prefix, attendanceLogId) {
  return `${prefix}:${attendanceLogId}`;
}

export function useGeofenceMonitor(
  deployment,
  { attendanceLogId = null, enabled = true } = {},
) {
  const checkInProgressRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled || !attendanceLogId) return undefined;

    const site = deployment?.client_sites;
    if (!site) return undefined;

    let mounted = true;
    let intervalId = null;

    const outsideSinceKey = getStateKey(OUTSIDE_SINCE_KEY, attendanceLogId);
    const notifiedKey = getStateKey(NOTIFIED_KEY, attendanceLogId);
    const reviewFlaggedKey = getStateKey(REVIEW_FLAGGED_KEY, attendanceLogId);

    const clearOutsideState = async () => {
      await AsyncStorage.multiRemove([
        outsideSinceKey,
        notifiedKey,
        reviewFlaggedKey,
      ]);
    };

    const showOutsideWarning = async (siteName, outsideMinutes) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Outside Geofence",
          body: `You have been outside the assigned geofence area for about ${outsideMinutes} minutes. Please return within the assigned radius for ${siteName}.`,
          data: {
            type: "geofence_warning",
            attendanceLogId,
          },
        },
        trigger: null,
      });
    };

    const getViolationStage = (outsideDurationMs, hasOutsideStart) => {
      if (!hasOutsideStart) return "warning_ping";
      if (outsideDurationMs >= REVIEW_AFTER_MS) return "review_required";
      if (outsideDurationMs >= NOTIFY_AFTER_MS) return "guard_notified";
      return "warning_ping";
    };

    const checkGeofence = async () => {
      if (checkInProgressRef.current) return;

      checkInProgressRef.current = true;
      try {
        const now = Date.now();
        const result = await validateGuardLocation(site);
        const outsideSinceRaw = await AsyncStorage.getItem(outsideSinceKey);
        const outsideSince = Number(outsideSinceRaw || 0);

        if (result.isInside) {
          await saveLocationPing({
            attendanceLogId,
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            isWithinGeofence: true,
            violationStage: "inside",
          });
          await clearOutsideState();
          return;
        }

        const outsideStartedAt = Number.isFinite(outsideSince) && outsideSince > 0
          ? outsideSince
          : now;
        const outsideDurationMs = now - outsideStartedAt;
        const stage = getViolationStage(outsideDurationMs, Boolean(outsideSinceRaw));

        if (!outsideSinceRaw) {
          await AsyncStorage.setItem(outsideSinceKey, String(outsideStartedAt));
        }

        await saveLocationPing({
          attendanceLogId,
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          isWithinGeofence: false,
          violationStage: stage,
        });

        const wasNotified = await AsyncStorage.getItem(notifiedKey);
        if (mounted && outsideDurationMs >= NOTIFY_AFTER_MS && !wasNotified) {
          const siteName = site.site_name || "your assigned site";
          const outsideMinutes = Math.max(5, Math.round(outsideDurationMs / 60000));
          await showOutsideWarning(siteName, outsideMinutes);
          await AsyncStorage.setItem(notifiedKey, "true");
        }

        const wasFlaggedForReview = await AsyncStorage.getItem(reviewFlaggedKey);
        if (outsideDurationMs >= REVIEW_AFTER_MS && !wasFlaggedForReview) {
          await AsyncStorage.setItem(reviewFlaggedKey, "true");
        }
      } catch (err) {
        console.warn("Geofence monitor check failed:", err.message || err);
      } finally {
        checkInProgressRef.current = false;
      }
    };

    intervalId = setInterval(() => {
      checkGeofence();
    }, CHECK_INTERVAL_MS);

    checkGeofence();

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;

      if (wasInactive && nextState === "active") {
        checkGeofence();
      }
    });

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      appStateSubscription?.remove?.();
    };
  }, [attendanceLogId, deployment, enabled]);
}
