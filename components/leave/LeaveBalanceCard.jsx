import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LeaveBalanceCard = ({ credits = 0, loading = false }) => {
  const rows = Array.isArray(credits?.byType) ? credits.byType : [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Leave Availability - {credits?.year || ""}</Text>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : rows.map((item) => (
        <View key={item.leaveType} style={styles.balanceRow}>
          <Text style={styles.typeLabel}>{item.leaveTypeLabel}</Text>
          <Text style={styles.balanceValue}>
            {item.leaveType === "service_incentive"
              ? `${item.remainingRequests ?? 0}/${item.maxRequests ?? 2} requests, ${item.remainingDays ?? 0} days`
              : `${item.remainingRequests ?? 0} of ${item.maxRequests ?? 2} requests`}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default LeaveBalanceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#093269",
    borderRadius: 20,
    padding: 20,
    gap: 10,
    shadowColor: "#093269",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 10,
  },
  typeLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  balanceValue: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
  },
});
