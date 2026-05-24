import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LEAVE_TYPE_LABELS } from "@/constants/leaveTypes";

const STATUS_STYLES = {
  pending: { label: "Pending", color: "#92400e", backgroundColor: "#fef3c7" },
  approved: { label: "Approved", color: "#166534", backgroundColor: "#dcfce7" },
  rejected: { label: "Rejected", color: "#991b1b", backgroundColor: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#475569", backgroundColor: "#e2e8f0" },
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function LeaveRequestHistory({ requests = [], loading = false, onCancel }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Requests</Text>
        <Text style={styles.subtitle}>{loading ? "Loading..." : `${requests.length} total`}</Text>
      </View>

      {!loading && requests.length === 0 ? (
        <Text style={styles.empty}>No submitted leave requests yet.</Text>
      ) : (
        requests.map((request) => {
          const status = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
          return (
            <View key={request.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemTitleWrap}>
                  <Text style={styles.itemTitle}>
                    {LEAVE_TYPE_LABELS[request.leaveType] || request.leaveTypeLabel}
                  </Text>
                  <Text style={styles.dateRange}>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: status.backgroundColor }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {request.status === "approved" && request.reliever?.name ? (
                <Text style={styles.meta}>
                  Reliever: {request.reliever.name} ({request.reliever.employeeIdNumber})
                </Text>
              ) : null}

              {request.status === "rejected" && request.reviewNotes ? (
                <Text style={styles.meta}>Reason: {request.reviewNotes}</Text>
              ) : null}

              {request.status === "pending" ? (
                <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel?.(request)}>
                  <Text style={styles.cancelText}>Cancel Request</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  empty: {
    fontSize: 13,
    color: "#64748b",
  },
  item: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitleWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  dateRange: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default LeaveRequestHistory;
