import { Feather, FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import LeavePicker from "./LeavePicker";

const LEAVE_TYPE_LABELS = {
  sick: "Sick Leave",
  vacation: "Vacation Leave",
  emergency: "Emergency Leave",
  paternity: "Paternity / Maternity Leave",
};

const formatDisplay = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * LeaveForm
 * Props:
 *   formData  { leaveType, startDate, endDate, reason }
 *   onChange  (field: string, value: string) => void
 *   onSubmit  () => void
 */
const LeaveForm = ({ formData, onChange, onSubmit }) => {
  const [showLeavePicker, setShowLeavePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleStartDate = (event, selected) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selected) onChange("startDate", selected.toISOString().split("T")[0]);
  };

  const handleEndDate = (event, selected) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selected) onChange("endDate", selected.toISOString().split("T")[0]);
  };

  return (
    <View style={styles.card}>
      {/* ── Leave Type ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Leave Type</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowLeavePicker(true)}
          activeOpacity={0.75}
        >
          <FontAwesome5
            name="clipboard-list"
            size={13}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !formData.leaveType && styles.placeholder,
            ]}
          >
            {formData.leaveType
              ? LEAVE_TYPE_LABELS[formData.leaveType]
              : "Select Leave Type"}
          </Text>
          <Feather name="chevron-down" size={15} color="#8A94A6" />
        </TouchableOpacity>
      </View>

      {/* ── Start Date ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowStartPicker(true)}
          activeOpacity={0.75}
        >
          <Feather
            name="calendar"
            size={14}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !formData.startDate && styles.placeholder,
            ]}
          >
            {formatDisplay(formData.startDate) ?? "mm / dd / yyyy"}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={
              formData.startDate ? new Date(formData.startDate) : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={handleStartDate}
          />
        )}
      </View>

      {/* ── End Date ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowEndPicker(true)}
          activeOpacity={0.75}
        >
          <Feather
            name="calendar"
            size={14}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[styles.inputText, !formData.endDate && styles.placeholder]}
          >
            {formatDisplay(formData.endDate) ?? "mm / dd / yyyy"}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={formData.endDate ? new Date(formData.endDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={
              formData.startDate ? new Date(formData.startDate) : new Date()
            }
            onChange={handleEndDate}
          />
        )}
      </View>

      {/* ── Reason ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Reason</Text>
        <View style={[styles.inputRow, styles.textAreaRow]}>
          <Feather
            name="edit-2"
            size={14}
            color="#8A94A6"
            style={[styles.icon, { marginTop: 1 }]}
          />
          <TextInput
            style={styles.textArea}
            placeholder="Please describe the reason for your leave..."
            placeholderTextColor="#B0B8C9"
            value={formData.reason}
            onChangeText={(v) => onChange("reason", v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* ── Submit ── */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={onSubmit}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>Submit Request</Text>
      </TouchableOpacity>

      {/* ── Leave Type Picker ── */}
      <LeavePicker
        visible={showLeavePicker}
        selected={formData.leaveType}
        onSelect={(val) => {
          onChange("leaveType", val);
          setShowLeavePicker(false);
        }}
        onClose={() => setShowLeavePicker(false)}
      />
    </View>
  );
};

export default LeaveForm;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A94A6",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FAFBFD",
  },
  textAreaRow: {
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A2340",
  },
  placeholder: {
    color: "#B0B8C9",
    fontWeight: "400",
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: "#1A2340",
    minHeight: 84,
    lineHeight: 21,
  },
  submitBtn: {
    backgroundColor: "#E6B215",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#E6B215",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
