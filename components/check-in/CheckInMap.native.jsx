import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrismColors } from "@/constants/prismTheme";

const EARTH_METERS_PER_DEGREE_LAT = 110540;
const EARTH_METERS_PER_DEGREE_LNG = 111320;
const TERRAIN_PATCHES = [
  { left: "6%", top: "16%", width: 150, height: 82, color: "rgba(47, 89, 65, 0.74)", rotate: "-14deg" },
  { left: "58%", top: "8%", width: 170, height: 92, color: "rgba(70, 95, 74, 0.68)", rotate: "11deg" },
  { left: "48%", top: "42%", width: 210, height: 110, color: "rgba(54, 79, 66, 0.72)", rotate: "-8deg" },
  { left: "-8%", top: "55%", width: 180, height: 96, color: "rgba(85, 91, 69, 0.62)", rotate: "18deg" },
  { left: "24%", top: "72%", width: 190, height: 76, color: "rgba(38, 74, 83, 0.56)", rotate: "-5deg" },
];
const ROAD_SEGMENTS = [
  { left: "-12%", top: "31%", width: "128%", rotate: "-18deg" },
  { left: "8%", top: "66%", width: "94%", rotate: "12deg" },
  { left: "42%", top: "-4%", width: "92%", rotate: "83deg" },
];

function getPlanarOffsetMeters(origin, target) {
  const latitudeDelta = Number(target.latitude) - Number(origin.latitude);
  const longitudeDelta = Number(target.longitude) - Number(origin.longitude);
  const latitudeRadians = (Number(origin.latitude) * Math.PI) / 180;

  return {
    x: longitudeDelta * EARTH_METERS_PER_DEGREE_LNG * Math.cos(latitudeRadians),
    y: latitudeDelta * EARTH_METERS_PER_DEGREE_LAT,
  };
}

export default function CheckInMap({
  style,
  post,
  guardCoords,
  circleFill,
  circleColor,
  isInside,
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const radiusMeters = Math.max(Number(post.geofence_radius_meters) || 1, 1);
  const postCoordinate = useMemo(() => ({
    latitude: Number(post.latitude),
    longitude: Number(post.longitude),
  }), [post.latitude, post.longitude]);
  const guardCoordinate = useMemo(() => ({
    latitude: Number(guardCoords.latitude),
    longitude: Number(guardCoords.longitude),
  }), [guardCoords.latitude, guardCoords.longitude]);
  const offsetMeters = useMemo(
    () => getPlanarOffsetMeters(postCoordinate, guardCoordinate),
    [guardCoordinate, postCoordinate],
  );

  const width = layout.width || 1;
  const height = layout.height || 1;
  const visualRadius = Math.max(64, Math.min(width, height) * 0.24);
  const centerX = width / 2;
  const centerY = height * 0.46;
  const pixelsPerMeter = visualRadius / radiusMeters;
  const rawGuardX = centerX + offsetMeters.x * pixelsPerMeter;
  const rawGuardY = centerY - offsetMeters.y * pixelsPerMeter;
  const maxMarkerDistance = Math.min(width, height) * 0.42;
  const markerDistance = Math.hypot(rawGuardX - centerX, rawGuardY - centerY);
  const markerScale = markerDistance > maxMarkerDistance
    ? maxMarkerDistance / markerDistance
    : 1;
  const guardX = centerX + (rawGuardX - centerX) * markerScale;
  const guardY = centerY + (rawGuardY - centerY) * markerScale;
  const lineWidth = Math.hypot(guardX - centerX, guardY - centerY);
  const lineAngle = Math.atan2(guardY - centerY, guardX - centerX);

  return (
    <View
      style={[style, styles.container]}
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
    >
      <View style={styles.satelliteBase} />
      {TERRAIN_PATCHES.map((patch, index) => (
        <View
          key={`terrain-${index}`}
          style={[
            styles.terrainPatch,
            {
              left: patch.left,
              top: patch.top,
              width: patch.width,
              height: patch.height,
              backgroundColor: patch.color,
              transform: [{ rotate: patch.rotate }],
            },
          ]}
        />
      ))}
      {ROAD_SEGMENTS.map((road, index) => (
        <View
          key={`road-${index}`}
          style={[
            styles.road,
            {
              left: road.left,
              top: road.top,
              width: road.width,
              transform: [{ rotate: road.rotate }],
            },
          ]}
        />
      ))}
      <View style={styles.scanOverlay} />
      <View style={styles.header}>
        <Text style={styles.kicker}>Geofence Verification</Text>
        <Text style={styles.title} numberOfLines={1}>{post.site_name}</Text>
      </View>

      {layout.width > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.rangeLine,
              {
                left: (centerX + guardX) / 2 - lineWidth / 2,
                top: (centerY + guardY) / 2,
                width: lineWidth,
                transform: [{ rotate: `${lineAngle}rad` }],
              },
            ]}
          />
          <View
            style={[
              styles.geofenceCircle,
              {
                left: centerX - visualRadius,
                top: centerY - visualRadius,
                width: visualRadius * 2,
                height: visualRadius * 2,
                borderRadius: visualRadius,
                borderColor: circleColor,
                backgroundColor: circleFill,
              },
            ]}
          />
          <View
            style={[
              styles.postMarker,
              {
                left: centerX - 13,
                top: centerY - 13,
              },
            ]}
          >
            <Text style={styles.markerText}>P</Text>
          </View>
          <View
            style={[
              styles.guardMarker,
              isInside ? styles.guardInside : styles.guardOutside,
              {
                left: guardX - 13,
                top: guardY - 13,
              },
            ]}
          >
            <Text style={styles.markerText}>G</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#24352f",
  },
  satelliteBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#233b34",
  },
  terrainPatch: {
    position: "absolute",
    borderRadius: 28,
    opacity: 0.95,
  },
  road: {
    position: "absolute",
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(150, 148, 128, 0.34)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 22, 31, 0.18)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  header: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 18,
    zIndex: 3,
  },
  kicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  geofenceCircle: {
    position: "absolute",
    borderWidth: 2,
  },
  postMarker: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 4,
  },
  guardMarker: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 5,
  },
  guardInside: {
    backgroundColor: PrismColors.navy,
  },
  guardOutside: {
    backgroundColor: "#dc2626",
  },
  markerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  rangeLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    zIndex: 2,
  },
});
