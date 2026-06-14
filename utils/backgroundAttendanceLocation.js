import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { saveLocationPing } from "@/utils/locationPing";
import { buildLocationEvidence } from "@/utils/geofence";

export const ATTENDANCE_LOCATION_TASK = "prism-guard-attendance-location";

const CONTEXT_KEY = "attendance_background_location_context";
const LAST_INSIDE_PING_KEY = "attendance_background_last_inside_ping";
const NOTIFIED_KEY_PREFIX = "geofence_guard_notified";
const BACKGROUND_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
const INSIDE_PING_INTERVAL_MS = 3 * 60 * 60 * 1000;

function getNotifiedKey(attendanceLogId) {
  return `${NOTIFIED_KEY_PREFIX}:${attendanceLogId}`;
}

function getDistanceMeters(first, second) {
  const earthRadiusMeters = 6371000;
  const firstLatitude = (first.latitude * Math.PI) / 180;
  const secondLatitude = (second.latitude * Math.PI) / 180;
  const latitudeDelta = ((second.latitude - first.latitude) * Math.PI) / 180;
  const longitudeDelta = ((second.longitude - first.longitude) * Math.PI) / 180;
  const haversine = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude)
      * Math.cos(secondLatitude)
      * Math.sin(longitudeDelta / 2) ** 2
  );

  return earthRadiusMeters * 2 * Math.atan2(
    Math.sqrt(haversine),
    Math.sqrt(1 - haversine),
  );
}

function isProbablyInside(coords, context) {
  const siteLatitude = Number(context?.siteLatitude);
  const siteLongitude = Number(context?.siteLongitude);
  const radiusMeters = Number(context?.geofenceRadiusMeters);
  if (
    !Number.isFinite(siteLatitude)
    || !Number.isFinite(siteLongitude)
    || !Number.isFinite(radiusMeters)
  ) {
    return false;
  }

  return getDistanceMeters(
    { latitude: coords.latitude, longitude: coords.longitude },
    { latitude: siteLatitude, longitude: siteLongitude },
  ) <= radiusMeters;
}

async function getStoredContext() {
  const value = await AsyncStorage.getItem(CONTEXT_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    await AsyncStorage.removeItem(CONTEXT_KEY);
    return null;
  }
}

async function showOutsideWarning(context, ping) {
  const notifiedKey = getNotifiedKey(context.attendanceLogId);
  const wasNotified = await AsyncStorage.getItem(notifiedKey);
  if (wasNotified) return;

  const stage = ping?.violationStage;
  if (stage !== "guard_notified" && stage !== "review_required") return;

  const outsideMinutes = Math.max(
    5,
    Math.round((Number(ping.outsideDurationMs) || 0) / 60000),
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Outside Geofence",
      body: `You have been outside ${context.siteName || "your assigned site"} for about ${outsideMinutes} minutes. Please return within the assigned geofence.`,
      data: {
        type: "geofence_warning",
        attendanceLogId: context.attendanceLogId,
      },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(notifiedKey, "true");
}

async function processBackgroundLocation(location) {
  const context = await getStoredContext();
  const coords = location?.coords;
  if (!context?.attendanceLogId || !coords) return;

  const now = Date.now();
  const probablyInside = isProbablyInside(coords, context);
  const lastInsidePing = Number(
    await AsyncStorage.getItem(LAST_INSIDE_PING_KEY) || 0,
  );

  if (
    probablyInside
    && Number.isFinite(lastInsidePing)
    && now - lastInsidePing < INSIDE_PING_INTERVAL_MS
  ) {
    return;
  }

  const response = await saveLocationPing({
    attendanceLogId: context.attendanceLogId,
    locationEvidence: buildLocationEvidence(location),
  });
  const ping = response?.ping;

  if (ping?.isWithinGeofence) {
    await AsyncStorage.setItem(LAST_INSIDE_PING_KEY, String(now));
    await AsyncStorage.removeItem(getNotifiedKey(context.attendanceLogId));
    return;
  }

  await showOutsideWarning(context, ping);
}

if (!TaskManager.isTaskDefined(ATTENDANCE_LOCATION_TASK)) {
  TaskManager.defineTask(ATTENDANCE_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn("Background attendance location failed:", error.message);
      return;
    }

    const locations = data?.locations || [];
    const latestLocation = locations[locations.length - 1];
    if (!latestLocation) return;

    try {
      await processBackgroundLocation(latestLocation);
    } catch (taskError) {
      console.warn(
        "Background attendance location upload failed:",
        taskError.message || taskError,
      );
    }
  });
}

export async function isBackgroundLocationSupported() {
  const [taskManagerAvailable, locationAvailable] = await Promise.all([
    TaskManager.isAvailableAsync(),
    Location.isBackgroundLocationAvailableAsync(),
  ]);
  return taskManagerAvailable && locationAvailable;
}

export async function requestAttendanceBackgroundPermission() {
  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  const foregroundResult = foregroundPermission.status === "granted"
    ? foregroundPermission
    : await Location.requestForegroundPermissionsAsync();
  if (foregroundResult.status !== "granted") return false;

  const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
  return backgroundPermission.status === "granted";
}

export async function startAttendanceBackgroundTracking({
  attendanceLogId,
  site,
}) {
  if (!attendanceLogId || !site) return false;
  if (!await isBackgroundLocationSupported()) return false;

  const backgroundPermission = await Location.getBackgroundPermissionsAsync();
  if (backgroundPermission.status !== "granted") return false;

  const previousContext = await getStoredContext();
  if (previousContext?.attendanceLogId !== attendanceLogId) {
    await AsyncStorage.removeItem(LAST_INSIDE_PING_KEY);
    if (previousContext?.attendanceLogId) {
      await AsyncStorage.removeItem(
        getNotifiedKey(previousContext.attendanceLogId),
      );
    }
  }

  await AsyncStorage.setItem(CONTEXT_KEY, JSON.stringify({
    attendanceLogId,
    siteName: site.site_name || "your assigned site",
    siteLatitude: site.latitude,
    siteLongitude: site.longitude,
    geofenceRadiusMeters: site.geofence_radius_meters,
  }));

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    ATTENDANCE_LOCATION_TASK,
  );
  if (!hasStarted) {
    await Location.startLocationUpdatesAsync(ATTENDANCE_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: BACKGROUND_UPDATE_INTERVAL_MS,
      distanceInterval: 0,
      deferredUpdatesInterval: BACKGROUND_UPDATE_INTERVAL_MS,
      deferredUpdatesTimeout: BACKGROUND_UPDATE_INTERVAL_MS,
      activityType: Location.ActivityType.Other,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Prism Guard duty tracking",
        notificationBody: "Location verification is active while you are on duty.",
        notificationColor: "#093269",
        killServiceOnDestroy: false,
      },
    });
  }

  return true;
}

export async function stopAttendanceBackgroundTracking() {
  const context = await getStoredContext();
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    ATTENDANCE_LOCATION_TASK,
  ).catch(() => false);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(ATTENDANCE_LOCATION_TASK);
  }

  await AsyncStorage.multiRemove([
    CONTEXT_KEY,
    LAST_INSIDE_PING_KEY,
    ...(context?.attendanceLogId
      ? [getNotifiedKey(context.attendanceLogId)]
      : []),
  ]);
}
