import { PrismColors } from "@/constants/prismTheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthSelector({ month, year, onPrev, onNext }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrev} style={styles.arrow}>
        <Text style={styles.arrowText}>{"<"}</Text>
      </TouchableOpacity>
      <View style={styles.selectors}>
        <Text style={styles.label}>{MONTHS[month]}</Text>
        <Text style={styles.label}>{year}</Text>
      </View>
      <TouchableOpacity onPress={onNext} style={styles.arrow}>
        <Text style={styles.arrowText}>{">"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectors: { flexDirection: "row", gap: 8 },
  label: { fontSize: 16, fontWeight: "600", color: PrismColors.navy },
  arrow: { padding: 8 },
  arrowText: { fontSize: 18, color: PrismColors.navy, fontWeight: "700" },
});
