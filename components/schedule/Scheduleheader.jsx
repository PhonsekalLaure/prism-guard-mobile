import { PrismColors } from "@/constants/prismTheme";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScheduleHeader({ hasNotification = true }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>My Schedule</Text>
      <TouchableOpacity style={styles.bellBtn}>
        <Text style={styles.bellIcon}>🔔</Text>
        {hasNotification && <View style={styles.dot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PrismColors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: "#fff" },
  title: { fontSize: 18, fontWeight: "700", color: "#fff" },
  bellBtn: { padding: 4, position: "relative" },
  bellIcon: { fontSize: 22 },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PrismColors.gold,
  },
});
