import { Feather, FontAwesome5 } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LEAVE_TYPE_LABELS } from "@/constants/leaveTypes";
import { addDaysToDateKey, formatLeaveDate, getTodayDateKey } from "@/utils/leaveDates";
import LeavePicker from "./LeavePicker";
import ScheduledLeaveDatePicker from "./ScheduledLeaveDatePicker";

function getStartDateBounds(leaveType) {
  const today = getTodayDateKey();

  if (leaveType === "sick") {
    return { minDate: today, maxDate: today };
  }

  if (leaveType === "emergency") {
    return { minDate: today, maxDate: today };
  }

  if (leaveType === "maternity_paternity") {
    return { minDate: addDaysToDateKey(today, 1) || today };
  }

  return { minDate: today };
}

const LeaveForm = ({ formData, leaveCredits, onChange, onSubmit }) => {
  const [showLeavePicker, setShowLeavePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const leaveCreditsByType = Object.fromEntries(
    (leaveCredits?.byType || []).map((item) => [item.leaveType, item]),
  );
  const startDateBounds = getStartDateBounds(formData.leaveType);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      onChange("supportingDocument", {
        uri: asset.uri,
        name: asset.name || "supporting-document",
        type: asset.mimeType || "application/octet-stream",
        size: asset.size || null,
      });
    } catch (error) {
      Alert.alert(
        "File Selection Failed",
        error?.message || "Could not attach the selected document.",
      );
    }
  };

  return (
    <View style={styles.card}>
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

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => {
            if (!formData.leaveType) {
              Alert.alert("Select Leave Type", "Please choose a leave type first.");
              return;
            }
            setShowStartPicker(true);
          }}
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
            {formatLeaveDate(formData.startDate, "mm / dd / yyyy")}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <ScheduledLeaveDatePicker
            visible={showStartPicker}
            title="Select Start Date"
            selectedDate={formData.startDate}
            minDate={startDateBounds.minDate}
            maxDate={startDateBounds.maxDate}
            onSelect={(dateKey) => {
              onChange("startDate", dateKey);
              if (formData.endDate && formData.endDate < dateKey) {
                onChange("endDate", "");
              }
            }}
            onClose={() => setShowStartPicker(false)}
          />
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => {
            if (!formData.leaveType) {
              Alert.alert("Select Leave Type", "Please choose a leave type first.");
              return;
            }
            if (!formData.startDate) {
              Alert.alert("Select Start Date", "Please choose the start date first.");
              return;
            }
            setShowEndPicker(true);
          }}
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
            {formatLeaveDate(formData.endDate, "mm / dd / yyyy")}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <ScheduledLeaveDatePicker
            visible={showEndPicker}
            title="Select End Date"
            selectedDate={formData.endDate}
            minDate={formData.startDate || getTodayDateKey()}
            rangeStartDate={formData.startDate}
            onSelect={(dateKey) => onChange("endDate", dateKey)}
            onClose={() => setShowEndPicker(false)}
          />
        )}
      </View>

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

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Supporting Document</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={handlePickDocument}
          activeOpacity={0.75}
        >
          <Feather
            name="paperclip"
            size={14}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !formData.supportingDocument && styles.placeholder,
            ]}
            numberOfLines={1}
          >
            {formData.supportingDocument?.name || "Attach PDF or image"}
          </Text>
          {formData.supportingDocument ? (
            <Pressable
              style={styles.clearFileButton}
              onPress={(event) => {
                event.stopPropagation();
                onChange("supportingDocument", null);
              }}
            >
              <Feather name="x" size={15} color="#8A94A6" />
            </Pressable>
          ) : (
            <Feather name="upload" size={15} color="#8A94A6" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={onSubmit}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>Submit Request</Text>
      </TouchableOpacity>

      <LeavePicker
        visible={showLeavePicker}
        selected={formData.leaveType}
        onSelect={(val) => {
          onChange("leaveType", val);
          onChange("startDate", "");
          onChange("endDate", "");
          setShowLeavePicker(false);
        }}
        onClose={() => setShowLeavePicker(false)}
        leaveCreditsByType={leaveCreditsByType}
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
  clearFileButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
