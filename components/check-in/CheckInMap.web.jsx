import { StyleSheet, Text, View } from "react-native";
import { PrismColors } from "@/constants/prismTheme";

export default function CheckInMap({ style, post, isInside }) {
  return (
    <View style={[style, styles.webMap, isInside ? styles.inside : styles.outside]}>
      <Text style={styles.kicker}>Location Verification</Text>
      <Text style={styles.title}>{post.site_name}</Text>
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
  radius: {
    marginTop: 14,
    fontSize: 13,
    color: PrismColors.textSecondary,
  },
});
