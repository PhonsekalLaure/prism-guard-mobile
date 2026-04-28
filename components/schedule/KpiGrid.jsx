import { PrismColors } from "@/constants/prismTheme";
import { StyleSheet, Text, View } from "react-native";

const KPI_COLORS = {
  absents: "#e74c3c",
  lates: "#f39c12",
  leaves: "#2ecc71",
  hours: PrismColors.navy,
};

export default function KpiGrid({
  absents = 0,
  lates = 1,
  leaves = 5,
  hours = 34,
}) {
  const items = [
    { label: "ABSENTS", value: absents, color: KPI_COLORS.absents },
    { label: "LATES", value: lates, color: KPI_COLORS.lates },
    { label: "LEAVES", value: leaves, color: KPI_COLORS.leaves },
    { label: "HOURS", value: hours, color: KPI_COLORS.hours },
  ];
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <Text style={[styles.value, { color: item.color }]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  value: { fontSize: 22, fontWeight: "800" },
  label: {
    fontSize: 9,
    color: "#999",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
