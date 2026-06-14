import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { validateGuardLocation } from "@/utils/geofence";
import { saveLocationPing } from "@/utils/locationPing";

const CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000;
const NOTIFY_AFTER_MS = 5 * 60 * 1000;
const REVIEW_AFTER_MS = 15 * 60 * 1000;
const NOTIFIED_KEY = "geofence_guard_notified";

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
    let warningTimerId = null;
    let reviewTimerId = null;

    const notifiedKey = getStateKey(NOTIFIED_KEY, attendanceLogId);

    const clearOutsideState = async () => {
      if (warningTimerId) clearTimeout(warningTimerId);
      if (reviewTimerId) clearTimeout(reviewTimerId);
      warningTimerId = null;
      reviewTimerId = null;
      await AsyncStorage.removeItem(notifiedKey);
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

    const checkGeofence = async () => {
      if (checkInProgressRef.current) return;

      checkInProgressRef.current = true;
      try {
        const result = await validateGuardLocation(site);

        if (result.isInside) {
          await saveLocationPing({
            attendanceLogId,
            locationEvidence: result.locationEvidence,
          });
          await clearOutsideState();
          return;
        }

        const response = await saveLocationPing({
          attendanceLogId,
          locationEvidence: result.locationEvidence,
        });
        const stage = response?.ping?.violationStage || "warning_ping";
        const outsideDurationMs = Number(response?.ping?.outsideDurationMs) || 0;

        const wasNotified = await AsyncStorage.getItem(notifiedKey);
        if (
          mounted
          && (stage === "guard_notified" || stage === "review_required")
          && !wasNotified
        ) {
          const siteName = site.site_name || "your assigned site";
          const outsideSince = response?.ping?.outsideSince
            ? new Date(response.ping.outsideSince).getTime()
            : Date.now() - NOTIFY_AFTER_MS;
          const outsideMinutes = Math.max(
            5,
            Math.round((Date.now() - outsideSince) / 60000),
          );
          await showOutsideWarning(siteName, outsideMinutes).catch((notificationError) => {
            console.warn(
              "Geofence notification failed:",
              notificationError.message || notificationError,
            );
          });
          await AsyncStorage.setItem(notifiedKey, "true");
        }

        if (stage === "warning_ping" && !warningTimerId) {
          const warningDelayMs = Math.max(1000, NOTIFY_AFTER_MS - outsideDurationMs);
          warningTimerId = setTimeout(() => {
            warningTimerId = null;
            checkGeofence();
          }, warningDelayMs);
        }

        if (stage !== "review_required" && !reviewTimerId) {
          const reviewDelayMs = Math.max(1000, REVIEW_AFTER_MS - outsideDurationMs);
          reviewTimerId = setTimeout(() => {
            reviewTimerId = null;
            checkGeofence();
          }, reviewDelayMs);
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
      if (warningTimerId) clearTimeout(warningTimerId);
      if (reviewTimerId) clearTimeout(reviewTimerId);
      appStateSubscription?.remove?.();
    };
  }, [attendanceLogId, deployment, enabled]);
}
