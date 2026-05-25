import { Feather } from "@expo/vector-icons";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LEAVE_OPTIONS } from "@/constants/leaveTypes";

/**
 * LeavePicker
 * Props:
 *   visible   bool
 *   selected  string
 *   onSelect  (value: string) => void
 *   onClose   () => void
 */
const LeavePicker = ({
  visible,
  selected,
  onSelect,
  onClose,
  leaveCreditsByType = {},
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    {/* Tap outside to dismiss */}
    <Pressable style={styles.backdrop} onPress={onClose} />

    <View style={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.sheetTitle}>Select Leave Type</Text>

      {LEAVE_OPTIONS.map((opt) => {
        const active = selected === opt.value;
        const credit = leaveCreditsByType[opt.value];
        const remaining = credit?.remainingDays ?? credit?.remainingRequests;
        const remainingUnit = credit?.remainingDays !== null && credit?.remainingDays !== undefined
          ? "days"
          : "left";
        const disabled = remaining === 0 || credit?.remainingRequests === 0;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionRow,
              active && styles.optionRowActive,
              disabled && styles.optionRowDisabled,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <View
              style={[styles.optionIcon, active && styles.optionIconActive]}
            >
              <Feather
                name={opt.icon}
                size={15}
                color={active ? "#FFFFFF" : "#8A94A6"}
              />
            </View>
            <Text
              style={[styles.optionLabel, active && styles.optionLabelActive]}
            >
              {opt.label}
            </Text>
            {typeof remaining === "number" && (
              <Text style={styles.remainingText}>{remaining} {remainingUnit}</Text>
            )}
            {active && (
              <Feather name="check-circle" size={16} color="#093269" />
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

export default LeavePicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 50, 105, 0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 38,
    gap: 10,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: "#E0E5EF",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2340",
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8ECF2",
    backgroundColor: "#FAFBFD",
    gap: 12,
  },
  optionRowActive: {
    borderColor: "#093269",
    backgroundColor: "#EEF2FA",
  },
  optionRowDisabled: {
    opacity: 0.55,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0F3FA",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIconActive: {
    backgroundColor: "#093269",
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
  },
  optionLabelActive: {
    color: "#093269",
    fontWeight: "700",
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A94A6",
  },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F4F6FB",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A94A6",
  },
});
