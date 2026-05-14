// utils/geofence.js
import * as Location from "expo-location";

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

export async function validateGuardLocation(site) {
  const siteLatitude = Number(site?.latitude);
  const siteLongitude = Number(site?.longitude);
  const radiusMeters = Number(site?.geofence_radius_meters);

  if (
    !Number.isFinite(siteLatitude) ||
    !Number.isFinite(siteLongitude) ||
    !Number.isFinite(radiusMeters)
  ) {
    throw new Error("Assigned site geofence is incomplete");
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  const { latitude, longitude, accuracy } = position.coords;

  const distance = getDistanceMeters(
    { latitude, longitude },
    { latitude: siteLatitude, longitude: siteLongitude },
  );

  return {
    isInside: distance <= radiusMeters,
    distance: Math.round(distance),
    post: {
      ...site,
      latitude: siteLatitude,
      longitude: siteLongitude,
      geofence_radius_meters: radiusMeters,
    },
    coords: { latitude, longitude, accuracy },
    timestamp: position.timestamp,
  };
}
