import { StyleSheet, Text, View } from "react-native";
import { PrismColors } from "@/constants/prismTheme";

const formatCoord = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : "N/A";
};

export default function CheckInMap({ style, post, guardCoords, isInside }) {
  return (
    <View style={[style, styles.webMap, isInside ? styles.inside : styles.outside]}>
      <Text style={styles.kicker}>Location Verification</Text>
      <Text style={styles.title}>{post.site_name}</Text>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Post</Text>
          <Text style={styles.value}>
            {formatCoord(post.latitude)}, {formatCoord(post.longitude)}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Guard</Text>
          <Text style={styles.value}>
            {formatCoord(guardCoords?.latitude)}, {formatCoord(guardCoords?.longitude)}
          </Text>
        </View>
      </View>
      <Text style={styles.radius}>Allowed radius: {post.geofence_radius_meters}m</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#e9eef7",
  },
  inside: {
    borderBottomColor: "rgba(76, 175, 80, 0.45)",
    borderBottomWidth: 5,
  },
  outside: {
    borderBottomColor: "rgba(244, 67, 54, 0.45)",
    borderBottomWidth: 5,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: PrismColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "800",
    color: PrismColors.navy,
    textAlign: "center",
  },
  grid: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cell: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  label: {
    fontSize: 12,
    color: PrismColors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    color: PrismColors.navy,
  },
  radius: {
    marginTop: 14,
    fontSize: 13,
    color: PrismColors.textSecondary,
  },
});
