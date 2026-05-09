// app/check-in-confirmation.jsx
import { PrismColors } from "@/constants/prismTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

const CHECK_TYPE_LABELS = {
  shift_start: "Time In",
  check_3h: "3-Hour Check",
  check_6h: "6-Hour Check",
  check_9h: "9-Hour Check",
  logout: "Time Out",
};

export default function CheckInConfirmation() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const post = JSON.parse(params.post);
  const guardCoords = JSON.parse(params.guardCoords);
  const distance = Number(params.distance);
  const checkType = params.checkType;
  const timestamp = params.timestamp;

  const formattedTime = new Date(timestamp).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDate = new Date(timestamp).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const region = {
    latitude: post.latitude,
    longitude: post.longitude,
    latitudeDelta: (post.geofence_radius_meters / 111000) * 5,
    longitudeDelta: (post.geofence_radius_meters / 111000) * 5,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Circle
          center={{ latitude: post.latitude, longitude: post.longitude }}
          radius={post.geofence_radius_meters}
          fillColor="rgba(76, 175, 80, 0.2)"
          strokeColor="rgba(76, 175, 80, 0.9)"
          strokeWidth={2}
        />
        <Marker
          coordinate={{ latitude: post.latitude, longitude: post.longitude }}
          title={post.site_name}
          pinColor="green"
        />
        <Marker
          coordinate={guardCoords}
          title="Your Location"
          pinColor="blue"
        />
      </MapView>

      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            ✅ {CHECK_TYPE_LABELS[checkType]} Recorded
          </Text>
        </View>

        <Text style={styles.postName}>{post.site_name}</Text>
        <Text style={styles.timestamp}>
          {formattedTime} · {formattedDate}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distance from Post</Text>
            <Text style={styles.statValue}>{distance}m</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Allowed Radius</Text>
            <Text style={styles.statValue}>{post.geofence_radius_meters}m</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  map: { height: "45%" },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
  },
  badge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: { color: "#2e7d32", fontWeight: "600", fontSize: 14 },
  postName: {
    fontSize: 22,
    fontWeight: "700",
    color: PrismColors.navy,
    marginBottom: 4,
  },
  timestamp: { fontSize: 14, color: "#888", marginBottom: 20 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 28,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: PrismColors.navy },
  button: {
    backgroundColor: PrismColors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: PrismColors.gold, fontWeight: "600", fontSize: 16 },
});
