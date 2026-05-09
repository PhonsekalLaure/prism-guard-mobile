// utils/geofence.js
import * as Location from "expo-location";

function getDistanceMeters(coord1, coord2) {
  const R = 6371000;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Now accepts site directly instead of fetching it
export async function validateGuardLocation(site) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  const { latitude, longitude, accuracy } = position.coords;

  const distance = getDistanceMeters(
    { latitude, longitude },
    { latitude: site.latitude, longitude: site.longitude },
  );

  return {
    isInside: distance <= site.geofence_radius_meters,
    distance: Math.round(distance),
    post: site,
    coords: { latitude, longitude, accuracy },
    timestamp: position.timestamp,
  };
}
