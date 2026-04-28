import { PrismColors } from "@/constants/prismTheme";
import { StyleSheet, Text, View } from "react-native";

export default function DeploymentCard({
  location = "SM Mall of Asia",
  address = "Pasay City • Main Entrance",
  timeStart = "07:00",
  timeEnd = "19:00",
  status = "ACTIVE",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>CURRENT DEPLOYMENT</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🏢</Text>
        </View>
        <View>
          <Text style={styles.location}>{location}</Text>
          <Text style={styles.address}>{address}</Text>
          <Text style={styles.time}>
            🕐 {timeStart} - {timeEnd}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#2ecc71" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 22 },
  location: { fontSize: 15, fontWeight: "700", color: PrismColors.navy },
  address: { fontSize: 12, color: "#999", marginTop: 2 },
  time: {
    fontSize: 12,
    color: PrismColors.gold,
    marginTop: 4,
    fontWeight: "600",
  },
});
