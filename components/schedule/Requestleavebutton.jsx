import { PrismColors } from "@/constants/prismTheme";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function RequestLeaveButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.text}>Request Leave</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: PrismColors.gold,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  icon: { fontSize: 18 },
  text: { fontSize: 16, fontWeight: "700", color: PrismColors.navy },
});
