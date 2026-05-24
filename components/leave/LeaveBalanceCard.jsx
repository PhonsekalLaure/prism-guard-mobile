import { FontAwesome5 } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * LeaveBalanceCard
 * Props:
 *   credits  {object|number}  - available leave request slots from DB
 *   loading  {boolean} - show skeleton while fetching
 */
const LeaveBalanceCard = ({ credits = 0, loading = false }) => {
  const availableRequests =
    typeof credits === "number" ? credits : credits?.availableCredits ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.textGroup}>
        <Text style={styles.label}>Available Requests</Text>
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
            size="small"
            style={{ marginTop: 8 }}
          />
        ) : (
          <View style={styles.creditsRow}>
            <Text style={styles.creditsNumber}>{availableRequests}</Text>
            <Text style={styles.creditsUnit}> Requests</Text>
          </View>
        )}
      </View>
      <View style={styles.iconCircle}>
        <FontAwesome5 name="umbrella-beach" size={26} color="#E6B215" />
      </View>
    </View>
  );
};

export default LeaveBalanceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#093269",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#093269",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  textGroup: {
    gap: 4,
    minHeight: 56,
    justifyContent: "center",
  },
  label: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  creditsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 2,
  },
  creditsNumber: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    lineHeight: 48,
  },
  creditsUnit: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    marginLeft: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
});
