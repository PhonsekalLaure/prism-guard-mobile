// utils/geofence.js
import * as Location from "expo-location";
import { Platform } from "react-native";

const DEFAULT_GEOFENCE_RADIUS_METERS = 100;
const MAX_ACCEPTABLE_ACCURACY_METERS = 75;
const LOCATION_ATTEMPT_COUNT = 3;
const LOCATION_TIMEOUT_MS = 12000;
const ANDROID_MOCK_PREFLIGHT_TIMEOUT_MS = 5000;

const MOCK_LOCATION_MESSAGE = "Mock location detected. Disable fake GPS and try again.";
const LOCATION_TIMEOUT_MESSAGE =
  "Location verification timed out. Disable fake GPS or location override apps, then try again.";

function createLocationError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createMockLocationError() {
  return createLocationError(MOCK_LOCATION_MESSAGE, "MOCK_LOCATION_DETECTED");
}

function createLocationTimeoutError() {
  return createLocationError(LOCATION_TIMEOUT_MESSAGE, "LOCATION_TIMEOUT");
}

export function normalizeCoordinate(value, fieldName = "coordinate") {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed;
}

export function normalizeSiteGeofence(site) {
  const latitude = normalizeCoordinate(site?.latitude, "site latitude");
  const longitude = normalizeCoordinate(site?.longitude, "site longitude");
  const radius = Number(site?.geofence_radius_meters);

  return {
    ...site,
    latitude,
    longitude,
    geofence_radius_meters: Number.isFinite(radius) && radius > 0
      ? radius
      : DEFAULT_GEOFENCE_RADIUS_METERS,
  };
}

function getDistanceMeters(coord1, coord2) {
  const earthRadiusMeters = 6371000;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSampleSpreadMeters(samples) {
  let maximumDistance = 0;
  for (let firstIndex = 0; firstIndex < samples.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < samples.length; secondIndex += 1) {
      maximumDistance = Math.max(
        maximumDistance,
        getDistanceMeters(samples[firstIndex].coords, samples[secondIndex].coords),
      );
    }
  }
  return Math.round(maximumDistance);
}

export function buildLocationEvidence(position, options = {}) {
  const coords = position?.coords || {};
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: coords.accuracy,
    capturedAt: new Date(position?.timestamp || Date.now()).toISOString(),
    mocked: position?.mocked === true,
    sampleCount: options.sampleCount || 1,
    sampleSpreadMeters: options.sampleSpreadMeters || 0,
    platform: Platform.OS,
  };
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createLocationTimeoutError());
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function assertNotMocked(position) {
  if (position?.mocked === true) {
    throw createMockLocationError();
  }
}

function isBetterPosition(candidate, current) {
  if (!current) return true;

  const candidateAccuracy = Number(candidate?.coords?.accuracy);
  const currentAccuracy = Number(current?.coords?.accuracy);

  if (!Number.isFinite(candidateAccuracy)) return false;
  if (!Number.isFinite(currentAccuracy)) return true;

  return candidateAccuracy < currentAccuracy;
}

async function getAccurateCurrentPosition() {
  if (Platform.OS === "android") {
    await Location.enableNetworkProviderAsync().catch(() => undefined);
    await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      }),
      ANDROID_MOCK_PREFLIGHT_TIMEOUT_MS,
    )
      .then(assertNotMocked)
      .catch((err) => {
        if (err?.code === "MOCK_LOCATION_DETECTED" || err?.code === "LOCATION_TIMEOUT") {
          throw err;
        }
      });
  }

  let bestPosition = null;
  const samples = [];

  for (let attempt = 0; attempt < LOCATION_ATTEMPT_COUNT; attempt += 1) {
    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
        }),
        LOCATION_TIMEOUT_MS,
      );

      assertNotMocked(position);
      samples.push(position);
      if (isBetterPosition(position, bestPosition)) {
        bestPosition = position;
      }

      const accuracy = Number(bestPosition?.coords?.accuracy);
      if (
        samples.length >= 2
        && Number.isFinite(accuracy)
        && accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS
      ) {
        break;
      }
    } catch (err) {
      if (err?.code === "MOCK_LOCATION_DETECTED") {
        throw err;
      }
      if (!bestPosition && attempt === LOCATION_ATTEMPT_COUNT - 1) {
        throw err;
      }
    }
  }

  if (!bestPosition?.coords) {
    throw new Error("Could not get your current location");
  }

  return {
    bestPosition,
    samples,
  };
}

export async function validateGuardLocation(site) {
  let normalizedSite;
  try {
    normalizedSite = normalizeSiteGeofence(site);
  } catch {
    throw new Error("Assigned site geofence is incomplete");
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const { bestPosition: position, samples } = await getAccurateCurrentPosition();

  const { latitude, longitude, accuracy } = position.coords;

  const distance = getDistanceMeters(
    { latitude, longitude },
    { latitude: normalizedSite.latitude, longitude: normalizedSite.longitude },
  );

  return {
    isInside: distance <= normalizedSite.geofence_radius_meters,
    distance: Math.round(distance),
    post: normalizedSite,
    coords: { latitude, longitude, accuracy },
    timestamp: position.timestamp,
    locationEvidence: buildLocationEvidence(position, {
      sampleCount: samples.length,
      sampleSpreadMeters: getSampleSpreadMeters(samples),
    }),
  };
}
