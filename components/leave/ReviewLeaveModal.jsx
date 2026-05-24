import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LEAVE_TYPE_LABELS } from "@/constants/leaveTypes";

const formatDisplay = (dateStr) => {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const ReviewLeaveModal = ({
  visible,
  formData,
  loading = false,
  onEdit,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onEdit}
  >
    <Pressable style={styles.backdrop} onPress={loading ? undefined : onEdit} />

    <View style={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.title}>Review Request</Text>
      <Text style={styles.subtitle}>
        Please confirm the details before sending your leave request.
      </Text>

      <View style={styles.detailsCard}>
        <DetailRow
          label="Leave Type"
          value={LEAVE_TYPE_LABELS[formData.leaveType] ?? "-"}
        />
        <DetailRow label="Start Date" value={formatDisplay(formData.startDate)} />
        <DetailRow label="End Date" value={formatDisplay(formData.endDate)} />
        <DetailRow label="Reason" value={formData.reason || "-"} />
        <DetailRow
          label="Supporting Document"
          value={formData.supportingDocument?.name || "-"}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={onEdit}
          activeOpacity={0.75}
          disabled={loading}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton, loading && styles.disabled]}
          onPress={onConfirm}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ReviewLeaveModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 50, 105, 0.42)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 36,
    gap: 14,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: "#E0E5EF",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2340",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A94A6",
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: 14,
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F6",
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A94A6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2340",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  editButton: {
    backgroundColor: "#F4F6FB",
  },
  confirmButton: {
    backgroundColor: "#E6B215",
  },
  disabled: {
    opacity: 0.7,
  },
  editText: {
    color: "#8A94A6",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
