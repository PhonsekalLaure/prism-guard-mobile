import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LEAVE_TYPE_LABELS } from "@/constants/leaveTypes";
import { formatLeaveDate } from "@/utils/leaveDates";

const STATUS_STYLES = {
  pending: { label: "Pending", color: "#92400e", backgroundColor: "#fef3c7" },
  approved: { label: "Approved", color: "#166534", backgroundColor: "#dcfce7" },
  rejected: { label: "Rejected", color: "#991b1b", backgroundColor: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#475569", backgroundColor: "#e2e8f0" },
};

function getReviewNoteLabel(status) {
  if (status === "approved") return "Notes";
  if (status === "cancelled") return "Cancellation notes";
  return "Reason";
}

function LeaveRequestHistory({
  requests = [],
  loading = false,
  page = 1,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
  onCancel,
  onOpenDocument,
}) {
  const previousDisabled = loading || page <= 1;
  const nextDisabled = loading || page >= totalPages;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Requests</Text>
        <Text style={styles.subtitle}>{loading ? "Loading..." : `${totalCount} total`}</Text>
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
                    {formatLeaveDate(request.startDate)} - {formatLeaveDate(request.endDate)}
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

              {["approved", "rejected", "cancelled"].includes(request.status) && request.reviewNotes ? (
                <Text style={styles.meta}>
                  {getReviewNoteLabel(request.status)}: {request.reviewNotes}
                </Text>
              ) : null}

              {request.hasSupportingDocument || request.supportingDocumentOriginalName ? (
                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => onOpenDocument?.(request)}
                >
                  <Feather name="paperclip" size={14} color="#0f3b73" />
                  <Text style={styles.documentText} numberOfLines={1}>
                    {request.supportingDocumentOriginalName || "Open supporting document"}
                  </Text>
                </TouchableOpacity>
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

      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, previousDisabled && styles.pageButtonDisabled]}
            onPress={() => onPageChange?.(page - 1)}
            disabled={previousDisabled}
            accessibilityLabel="Previous leave request page"
          >
            <Feather name="chevron-left" size={18} color="#0f3b73" />
          </TouchableOpacity>
          <Text style={styles.pageLabel}>Page {page} of {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageButton, nextDisabled && styles.pageButtonDisabled]}
            onPress={() => onPageChange?.(page + 1)}
            disabled={nextDisabled}
            accessibilityLabel="Next leave request page"
          >
            <Feather name="chevron-right" size={18} color="#0f3b73" />
          </TouchableOpacity>
        </View>
      ) : null}
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
  documentButton: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  documentText: {
    flex: 1,
    color: "#0f3b73",
    fontSize: 12,
    fontWeight: "700",
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
  pagination: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageLabel: {
    minWidth: 84,
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default LeaveRequestHistory;
